import { TRACKS, LEVELS, getSession } from './question-bank.js';
import { MCQS } from './mcq-bank.js';

// ============ DOM refs ============
const $ = (id) => document.getElementById(id);

const screens = {
  setup: $('screen-setup'),
  interview: $('screen-interview'),
  mcq: $('screen-mcq'),
  feedback: $('screen-feedback'),
};

const trackGrid = $('trackGrid');
const levelRow = $('levelRow');
const modeRow = $('modeRow');
const startBtn = $('startBtn');
const micHint = $('micHint');

const metaLine = $('metaLine');
const progressChip = $('progressChip');
const conversation = $('conversation');
const micBtn = $('micBtn');
const micStatus = $('micStatus');
const answerInput = $('answerInput');
const sendBtn = $('sendBtn');
const endBtn = $('endBtn');

const mcqMeta = $('mcqMeta');
const mcqProgress = $('mcqProgress');
const mcqScore = $('mcqScore');
const mcqEndBtn = $('mcqEndBtn');
const mcqQnum = $('mcqQnum');
const mcqQuestionText = $('mcqQuestionText');
const mcqOptions = $('mcqOptions');
const mcqFeedback = $('mcqFeedback');
const mcqFbTitle = $('mcqFbTitle');
const mcqFbExplain = $('mcqFbExplain');
const mcqNextBtn = $('mcqNextBtn');

const toast = $('toast');

// ============ Speech support detection ============
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;
const synthSupported = 'speechSynthesis' in window;
let speechSupported = SpeechRecognition !== null;

if (!speechSupported) {
  micHint.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>' +
    'Voice input needs <strong>Chrome or Edge</strong> (Web Speech API). Type your answers here — the interviewer still speaks and evaluates either way.';
}

// ============ State ============
let session = null;
let currentIndex = -1;
let interviewLog = []; // { role:'ai'|'user', text, source:'typed'|'voice', kind:'question'|'follow'|'answer', questionIndex }
let transcript = []; // { question, answer, source, score, matches, judged }
let busy = false; // ai speaking / evaluating
let recognition = null;
let listening = false;
let speechFinalText = ''; // accumulated voice transcript for the CURRENT answer only

// MCQ mode state
let mcqMode = false; // 'interview' | 'mcq' selected in setup
let mcqList = []; // the shuffled MCQ for this session
let mcqIndex = 0;
let mcqResults = []; // { q, selected, correct, options, explain }
const mcqAskedRecent = {}; // trackId -> most recently shown question texts (for variety across sessions)

// ============ Setup screen ============
function buildSetup() {
  trackGrid.innerHTML = '';
  TRACKS.forEach((track) => {
    const btn = document.createElement('button');
    btn.className = 'track-option';
    btn.type = 'button';
    btn.dataset.track = track.id;
    btn.innerHTML = `
      <span class="track-icon">${track.icon}</span>
      <b>${track.name}</b>
      <span>${track.blurb}</span>
    `;
    btn.addEventListener('click', () => {
      trackGrid.querySelectorAll('.track-option').forEach((o) => o.classList.remove('selected'));
      btn.classList.add('selected');
      updateStart();
      syncUrl();
    });
    trackGrid.appendChild(btn);
  });

  levelRow.innerHTML = '';
  LEVELS.forEach((level) => {
    const btn = document.createElement('button');
    btn.className = 'level-option';
    btn.type = 'button';
    btn.dataset.level = level.id;
    btn.innerHTML = `<b>${level.name}</b><span>${level.detail}</span>`;
    btn.addEventListener('click', () => {
      levelRow.querySelectorAll('.level-option').forEach((o) => o.classList.remove('selected'));
      btn.classList.add('selected');
      updateStart();
      syncUrl();
    });
    levelRow.appendChild(btn);
  });

  modeRow.querySelectorAll('.mode-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      modeRow.querySelectorAll('.mode-option').forEach((o) => o.classList.remove('selected'));
      btn.classList.add('selected');
      mcqMode = btn.dataset.mode === 'mcq';
      updateStart();
      syncUrl();
    });
  });
  // Default to the open-interview mode so the classic flow is one click away.
  const interviewOpt = modeRow.querySelector('[data-mode="interview"]');
  if (interviewOpt) {
    interviewOpt.classList.add('selected');
    mcqMode = false;
    updateStart();
  }

  initFromUrl();
}

// Deep-link support: preselect a track/level/mode when the URL carries ?track=…
// (used by SEO landing pages and shareable result links), and keep it in sync.
function syncUrl() {
  if (!window.history || !window.history.replaceState) return;
  const track = document.querySelector('.track-option.selected');
  const level = document.querySelector('.level-option.selected');
  const mode = document.querySelector('.mode-option.selected');
  if (!track) return;
  const params = new URLSearchParams();
  params.set('track', track.dataset.track);
  if (level) params.set('level', level.dataset.level);
  if (mode && mode.dataset.mode !== 'interview') params.set('mode', mode.dataset.mode);
  const url = new URL(window.location.href);
  url.search = params.toString();
  window.history.replaceState({}, '', url.pathname + url.search);
}

function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const trackId = params.get('track');
  const levelId = params.get('level');
  const mode = params.get('mode');
  if (trackId) {
    const t = trackGrid.querySelector(`.track-option[data-track="${trackId}"]`);
    if (t) {
      trackGrid.querySelectorAll('.track-option').forEach((o) => o.classList.remove('selected'));
      t.classList.add('selected');
    }
  }
  if (levelId) {
    const l = levelRow.querySelector(`.level-option[data-level="${levelId}"]`);
    if (l) {
      levelRow.querySelectorAll('.level-option').forEach((o) => o.classList.remove('selected'));
      l.classList.add('selected');
    }
  }
  if (mode && mode === 'mcq') {
    const m = modeRow.querySelector('.mode-option[data-mode="mcq"]');
    if (m) {
      modeRow.querySelectorAll('.mode-option').forEach((o) => o.classList.remove('selected'));
      m.classList.add('selected');
      mcqMode = true;
    }
  }
  updateStart();
}

function updateStart() {
  const track = document.querySelector('.track-option.selected');
  const level = document.querySelector('.level-option.selected');
  const mode = document.querySelector('.mode-option.selected');
  startBtn.disabled = !(track && level && mode);
  if (mode) startBtn.textContent = mode.dataset.mode === 'mcq' ? 'Start multiple choice' : 'Start the interview';
}

startBtn.addEventListener('click', async () => {
  const trackEl = document.querySelector('.track-option.selected');
  const levelEl = document.querySelector('.level-option.selected');
  const trackId = trackEl.dataset.track;
  const levelId = levelEl.dataset.level;
  const track = TRACKS.find((t) => t.id === trackId);
  const level = LEVELS.find((l) => l.id === levelId);

  if (mcqMode) {
    startBtn.disabled = true;
    startBtn.textContent = 'Fetching fresh questions…';
    await startMcq(track, level);
    startBtn.disabled = false;
    startBtn.textContent = 'Start multiple choice';
    return;
  }

  startBtn.disabled = true;
  startBtn.textContent = 'Loading fresh questions…';

  // Prefer freshly fetched (web) questions so every session differs; fall back
  // to the seeded local bank when offline or on any error.
  const loaded = await loadSession(trackId, levelId, 4);
  session = { track: loaded.track, level: loaded.level, questions: loaded.questions };

  startBtn.disabled = false;
  startBtn.textContent = 'Start the interview';

  transcript = [];
  interviewLog = [];
  currentIndex = 0;

  metaLine.textContent = `${session.track.name} · ${session.level.name} (${session.level.detail})`;
  conversation.innerHTML = '';
  showScreen('interview');
  updateProgress();
  addSystemBanner(
    `You have ${session.questions.length} questions in the ${session.track.name} track at ${session.level.name} level. ` +
      `${loaded.source === 'web' ? 'These are freshly gathered from the web — unique every session. ' : ''}` +
      `Answer each one like a real interview — I'll probe deeper when you're thin, and move on when you nail it. ` +
      `Hold the mic and speak, or type. Good luck.`
  );
  askQuestion(0);
});

async function loadSession(trackId, levelId, count) {
  const level = LEVELS.find((l) => l.id === levelId);
  let questions = null;
  let source = 'seeded';
  try {
    const res = await fetch(`/api/questions?track=${encodeURIComponent(trackId)}&level=${encodeURIComponent(levelId)}&count=${count}`);
    if (res.ok) {
      const data = await res.json();
      if (data.questions && data.questions.length) {
        questions = data.questions;
        source = data.source === 'web' ? 'web' : 'seeded';
      }
    }
  } catch {
    questions = null;
  }
  if (!questions) {
    const sel = getSession(trackId, levelId, count);
    questions = sel.questions;
    source = 'seeded';
  }
  const track = TRACKS.find((t) => t.id === trackId);
  return { track, level, questions, source };
}

// ============ Screen switching ============
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[name].classList.add('active');
  if (name === 'feedback') window.scrollTo(0, 0);
}

function updateProgress() {
  progressChip.textContent = `${Math.min(currentIndex + 1, session.questions.length)} / ${session.questions.length}`;
}

// ============ Conversation rendering ============
function addBubble(role, text, opts = {}) {
  const container = conversation;
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (opts.label) {
    const label = document.createElement('div');
    label.className = 'msg-label';
    label.textContent = opts.label;
    bubble.appendChild(label);
  }

  const body = document.createElement('div');
  body.textContent = text;
  bubble.appendChild(body);

  if (opts.badge) {
    const b = document.createElement('span');
    b.className = `badge ${opts.badgeClass || ''}`;
    b.textContent = opts.badge;
    bubble.appendChild(b);
  }

  if (opts.talked) {
    const t = document.createElement('div');
    t.className = 'talked';
    t.innerHTML =
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>` +
      `spoken`;
    bubble.appendChild(t);
  }

  wrap.appendChild(bubble);
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
  return wrap;
}

function addSystemBanner(text) {
  const wrap = addBubble('ai', text, { label: 'Interviewer' });
  wrap.querySelector('.msg-bubble').style.borderColor = 'var(--border-strong)';
  wrap.querySelector('.msg-bubble').style.background = 'var(--bg-input)';
}

function addTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'msg ai';
  wrap.id = 'typingMsg';
  wrap.innerHTML = `<div class="msg-bubble"><div class="msg-label">Interviewer</div><span class="typing">Thinking</span></div>`;
  conversation.appendChild(wrap);
  conversation.scrollTop = conversation.scrollHeight;
}

function removeTyping() {
  const t = $('typingMsg');
  if (t) t.remove();
}

// ============ Speech synthesis (AI voice) ============
function speak(text) {
  return new Promise((resolve) => {
    if (!synthSupported || typeof SpeechSynthesisUtterance !== 'function') return resolve();
    // cancel anything pending
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // pick an English voice when available
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find((v) => v.lang && v.lang.startsWith('en') && v.localService !== false);
    if (en) u.voice = en;
    u.rate = 1;
    u.pitch = 0.95;
    u.onend = resolve;
    u.onerror = resolve;
    window.speechSynthesis.speak(u);
    // safety timeout
    setTimeout(resolve, text.length * 65 + 600);
  });
}

// ============ Speech recognition (candidate voice) ============
function setupRecognition() {
  if (!SpeechRecognition) return;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) speechFinalText += res[0].transcript + ' ';
      else interim += res[0].transcript;
    }
    answerInput.value = (speechFinalText + interim).trim();
    answerInput.dispatchEvent(new Event('input'));
  };

  recognition.onend = () => {
    setListenState(false);
    if (speechFinalText.trim()) {
      micStatus.textContent = 'Captured. Review and send, or speak again.';
      micStatus.className = 'mic-status done';
    }
  };

  recognition.onerror = (e) => {
    setListenState(false);
    if (e.error === 'not-allowed') {
      showToast('Microphone access was blocked. Please allow it and try, or just type your answers.', 'error');
    } else if (e.error === 'no-speech') {
      micStatus.textContent = 'No speech detected — tap mic and try again, or type.';
      micStatus.className = 'mic-status idle';
    }
  };
}

function setListenState(on) {
  listening = on;
  micBtn.classList.toggle('listening', on);
  answerInput.classList.toggle('listening', on);
  if (on) {
    micStatus.textContent = 'Listening… speak your answer';
    micStatus.className = 'mic-status listening';
    micBtn.setAttribute('aria-label', 'Stop listening');
  } else {
    micStatus.textContent = 'Tap to speak';
    micStatus.className = 'mic-status idle';
    micBtn.setAttribute('aria-label', 'Speak answer');
  }
}

micBtn.addEventListener('click', () => {
  if (!speechSupported) {
    showToast('Speech recognition is not supported in this browser. Try Chrome or Edge, or just type.', 'error');
    return;
  }
  if (listening) {
    recognition.stop();
    return;
  }
  if (!recognition) setupRecognition();
  answerInput.value = '';
  speechFinalText = ''; // start each spoken answer fresh
  try {
    recognition.start();
    setListenState(true);
  } catch (e) {
    setListenState(false);
  }
});

// ============ Submitting an answer ============
function sendAnswer(forceText) {
  const text = (answerInput.value || '').trim();
  let source = 'typed';
  if (forceText === 'voice' || (listening && text)) {
    source = 'voice';
  }
  if (!text) {
    showToast('Say or type something first.', 'error');
    return;
  }
  if (recognition && listening) recognition.stop();
  setListenState(false);

  const q = session.questions[currentIndex];
  const isFollow = q._followActive === true;

  interviewLog.push({ role: 'user', text, source, kind: 'answer', questionIndex: currentIndex });
  addBubble('user', text, { label: 'You', talked: source === 'voice' });

  answerInput.value = '';
  speechFinalText = ''; // don't carry this answer's voice buffer into the next exchange
  evaluateAnswer(q, text, isFollow, source);
}

sendBtn.addEventListener('click', () => sendAnswer());

answerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAnswer();
  }
});

// ============ Adaptive evaluation ============
// Judges an answer against the question's keyword strengths, then decides:
//   strong  -> praise briefly and move on
//   weak    -> ask a follow-up (probe deeper)
//   silent  -> encourage / ask a follow-up
function judge(q, text) {
  const lower = text.toLowerCase();
  const matches = q.strengths.filter((s) => lower.includes(s.toLowerCase()));
  const matchCount = matches.length;
  const coverage = Math.min(1, matchCount / Math.max(3, q.strengths.length * 0.4));

  const tooBrief = text.split(/\s+/).length < 25;
  let judgment;
  if (matchCount >= 3 && !tooBrief) judgment = 'strong';
  else if (matchCount >= 1 || text.length > 40) judgment = 'weak';
  else judgment = 'silent';

  return { matches, matchCount, coverage, judgment };
}

async function evaluateAnswer(q, text, isFollow, source) {
  busy = true;
  addTyping();
  await pause(500);

  const { matches, coverage, judgment } = judge(q, text);

  // ---- follow-up answer: fold into the existing exchange record
  if (isFollow) {
    const rec = q._record;
    q._followUses += 1;
    if (rec) {
      rec.score = Math.max(rec.score, toScore(judgment, q, coverage));
      rec.judgment = betterOf(rec.judgment, judgment);
      rec.matches = rec.matches.concat(matches);
    }
    removeTyping();
    await handleJudgment(q, judgment, rec);
    return;
  }
  // ---- primary answer: create the exchange record
  const rec = {
    question: q.q,
    concept: q.concept,
    answer: text,
    source,
    matches,
    coverage,
    judgment,
    score: toScore(judgment, q, coverage),
    followUpsUsed: 0,
    q,
  };
  transcript.push(rec);
  q._record = rec;
  q._followUses = 0;

  await handleJudgment(q, judgment, rec);
}

// Decides what happens after an answer: praise+move on, ask a follow-up, or move on.
async function handleJudgment(q, judgment, rec) {
  removeTyping();
  if (judgment === 'strong') {
    const praise = pick([
      'Solid answer — that covers the core of it well.',
      'Good. You clearly understand this. Let\'s keep moving.',
      'Strong, that hits the important points.',
    ]);
    addBubble('ai', praise, { label: 'Interviewer', badge: 'Strong', badgeClass: 'strong' });
    interviewLog.push({ role: 'ai', text: praise, kind: 'feedback' });
    q._followActive = false;
    await speak(praise);
    moveToNext();
    return;
  }

  // weak / silent -> probe deeper with a follow-up
  const follow = q.followUps && q.followUps.length > 0 ? q.followUps[q._followUses] : null;
  if (follow) {
    q._followActive = true;
    const pivot = judgment === 'silent'
      ? 'I didn\'t get much detail there. Let me help you find the thread:'
      : 'You\'re on the right track, but let\'s go a little deeper:';
    addBubble('ai', follow, { label: 'Interviewer', badge: 'Follow-up', badgeClass: 'follow' });
    interviewLog.push({ role: 'ai', text: follow, kind: 'follow', questionIndex: currentIndex });
    await speak(pivot + ' ' + follow);
    busy = false;
    answerInput.focus();
    return;
  }

  // no more follow-ups available -> move on
  moveToNext();
}

function toScore(judgment, q, coverage) {
  if (judgment === 'strong') return Math.round(72 + coverage * 28);
  if (judgment === 'weak') return Math.round(Math.min(64, 40 + coverage * 40));
  return 28;
}

function betterOf(a, b) {
  const order = { silent: 0, weak: 1, strong: 2 };
  return order[b] > order[a] ? b : a;
}

function moveToNext() {
  busy = false;
  currentIndex += 1;
  if (currentIndex < session.questions.length) {
    updateProgress();
    askQuestion(currentIndex);
  } else {
    endSession();
  }
}

// ============ Asking a question ============
async function askQuestion(idx) {
  const q = session.questions[idx];
  addTyping();
  await pause(500);

  removeTyping();
  addBubble('ai', q.q, { label: 'Interviewer', badge: `Question ${idx + 1}` });
  interviewLog.push({ role: 'ai', text: q.q, kind: 'question', questionIndex: idx });
  answerInput.value = '';
  speechFinalText = ''; // fresh buffer for this new question
  updateProgress();
  await speak(q.q);
  busy = false;
  answerInput.focus();
}

// ============ MCQ mode ============
const MCQ_PER_SESSION = 10;

// Which difficulty tiers to draw from for each experience level.
const MCQ_TIER = {
  junior: ['junior', 'mid'],
  mid: ['mid', 'junior', 'senior'],
  senior: ['senior', 'mid'],
};

async function startMcq(track, level) {
  // Prefer freshly sourced (web) MCQs so each session differs; fall back to the
  // hand-seeded bank when offline or on any error.
  const fetched = await loadMcqPool(track.id);
  const pool = (fetched && fetched.length ? fetched : MCQS[track.id] || []).slice();
  const tier = MCQ_TIER[level.id] || ['mid'];

  // Order the pool level-first, then apply "avoid recently shown" so a new
  // test-start presents a different 10 than the previous run(s). When the
  // pool rolls over it simply cycles with a fresh shuffle.
  const preferred = pool.filter((q) => tier.includes(q.difficulty));
  const rest = pool.filter((q) => !tier.includes(q.difficulty));
  const ordered = [...shuffle(preferred), ...shuffle(rest)];

  const recent = mcqAskedRecent[track.id] || [];
  const fresh = ordered.filter((q) => !recent.includes(q.q));
  const selected = fresh.length >= MCQ_PER_SESSION
    ? fresh.slice(0, MCQ_PER_SESSION)
    : ordered.slice(0, MCQ_PER_SESSION);

  // Remember what we just showed so the next session skips it (rolling window).
  mcqAskedRecent[track.id] = selected.map((q) => q.q).slice(-MCQ_PER_SESSION);

  mcqList = selected;
  mcqIndex = 0;
  mcqResults = [];
  mcqMode = true;

  const rangeNames = { junior: 'easy', mid: 'medium', senior: 'hard' };
  mcqMeta.textContent = `${track.name} · ${level.name} (${level.detail}) · ${rangeNames[level.id] || ''} questions` +
    (fetched && fetched.length ? ' · fresh from the web' : '');
  showScreen('mcq');
  renderMcq();
}

// Fetch a pool of web MCQs for the track (a superset so the client can tier +
// dedup + select 10). Returns null on failure/netless.
async function loadMcqPool(trackId) {
  try {
    const res = await fetch(`/api/mcqs?track=${encodeURIComponent(trackId)}&count=20`);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.questions && data.questions.length) ? data.questions : null;
  } catch {
    return null;
  }
}

function renderMcq() {
  const item = mcqList[mcqIndex];
  const letters = ['A', 'B', 'C', 'D'];

  mcqQnum.textContent = `Q${mcqIndex + 1}`;
  mcqQuestionText.textContent = item.q;
  mcqProgress.textContent = `${mcqIndex + 1} / ${mcqList.length}`;
  const correctSoFar = mcqResults.filter((r) => r.correct).length;
  mcqScore.textContent = `${correctSoFar} / ${mcqResults.length || 0}`;

  mcqOptions.innerHTML = '';
  item.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'mcq-option';
    btn.type = 'button';
    btn.innerHTML = `<span class="mcq-option-letter">${letters[i]}</span><span class="mcq-option-text">${opt}</span>`;
    btn.addEventListener('click', () => selectMcq(i));
    mcqOptions.appendChild(btn);
  });

  mcqFeedback.hidden = true;
  mcqFeedback.classList.remove('good', 'bad');
  mcqNextBtn.disabled = true;
  mcqNextBtn.textContent = mcqIndex === mcqList.length - 1 ? 'See results' : 'Next question';
}

function selectMcq(idx) {
  const item = mcqList[mcqIndex];
  const opts = mcqOptions.children;
  const isCorrect = idx === item.correct;

  mcqResults.push({ q: item.q, selected: idx, correct: isCorrect, options: item.options, correctIdx: item.correct, explain: item.explain });

  // reveal: mark all, dim wrong ones
  for (let i = 0; i < opts.length; i++) {
    opts[i].disabled = true;
    if (i === item.correct) opts[i].classList.add('correct');
    else if (i === idx) opts[i].classList.add('incorrect');
    else opts[i].classList.add('dimmed');
  }

  mcqFeedback.hidden = false;
  mcqFeedback.classList.add(isCorrect ? 'good' : 'bad');
  mcqFbTitle.textContent = isCorrect ? 'Correct' : `Incorrect — the answer was ${String.fromCharCode(65 + item.correct)}`;
  mcqFbExplain.textContent = item.explain;

  const correctSoFar = mcqResults.filter((r) => r.correct).length;
  mcqScore.textContent = `${correctSoFar} / ${mcqResults.length}`;
  mcqNextBtn.disabled = false;
  mcqNextBtn.focus();
}

mcqNextBtn.addEventListener('click', () => {
  mcqIndex += 1;
  if (mcqIndex < mcqList.length) {
    renderMcq();
  } else {
    endMcq();
  }
});

mcqEndBtn.addEventListener('click', () => {
  if (mcqResults.length < mcqList.length && mcqResults.length > 0) {
    const again = confirm('You haven\'t finished all questions. Finish now and see results?');
    if (!again) return;
  }
  endMcq();
});

function endMcq() {
  showScreen('feedback');
  renderMcqReport();
}

// ============ End session ============
function endSession() {
  showScreen('feedback');
  renderFeedback();
}

endBtn.addEventListener('click', () => {
  if (busy) return;
  const confirmed = confirm('End the interview and see your feedback?');
  if (confirmed) endSession();
});

// ============ Feedback report ============
function renderFeedback() {
  $('reviewTitle').innerHTML = 'Question review &amp; strong answers';
  $('reviewSub').innerHTML = 'The model answer for <strong>every</strong> question in this session — read the ones you struggled on first.';

  const scores = transcript.map((t) => t.score || 0);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const readiness = Math.round(clamp(avg, 0, 100));

  $('scoreVal').textContent = readiness;
  // animate ring
  const ring = $('ringFg');
  ring.style.strokeDashoffset = 326.7 - (326.7 * readiness) / 100;

  $('covVal').textContent = (Math.round((avg / 100) * 100)) + '%';
  $('depthVal').textContent = depthPercent() + '%';
  $('accVal').textContent = accuracyPercent() + '%';

  const verdict = verdictFor(readiness);
  $('verdictTitle').textContent = verdict.title;
  $('verdictText').textContent = verdict.text;

  const strong = transcript.filter((t) => t.judgment === 'strong');
  const weak = transcript.filter((t) => t.judgment !== 'strong');
  const silent = transcript.filter((t) => t.judgment === 'silent');

  // strengths
  const strengths = [];
  strong.forEach((t) => strengths.push(`You gave a solid answer on <strong>${t.concept}</strong> — ${shorten(t.answer)}`));
  if (strong.length === 0) strengths.push('You engaged with the questions and kept the session going — a good start to build on.');
  // pull matched concepts even on weak answers as partial strengths
  transcript.forEach((t) => {
    if (t.judgment === 'weak' && t.matches.length) {
      if (strengths.length < 4) strengths.push(`You touched on <strong>${t.matches[0]}</strong> — that foundation can be built on.`);
    }
  });
  fillList('strengthsList', strengths.slice(0, 4));

  // gaps
  const gaps = [];
  weak.forEach((t) => gaps.push(`For "<em>${shorten(t.question, 70)}</em>", you needed more depth on <strong>${labelsFor(t.matches).join(', ') || 'key concepts'}</strong>. Read the strong answer below.`));
  silent.forEach((t) => gaps.push(`You didn't get into full detail on "<em>${shorten(t.question, 70)}</em>" — focus on giving concrete, structured answers.`));
  if (gaps.length === 0) gaps.push('No major gaps detected on the questions covered. Keep pressure-testing with edge cases and "why" questions.');
  fillList('gapsList', gaps.slice(0, 5));

  // review — ALL questions with model strong answers
  const reviewList = $('reviewList');
  reviewList.innerHTML = '';
  transcript.forEach((t) => {
    const item = document.createElement('div');
    item.className = 'review-item';
    const verdictClass =
      t.judgment === 'strong' ? 'strong' : t.judgment === 'weak' ? 'partial' : 'silent';
    const verdictLabel =
      t.judgment === 'strong' ? 'Strong' : t.judgment === 'weak' ? 'Needs depth' : 'Thin answer';
    item.innerHTML = `
      <div class="q">${t.question}</div>
      <div class="tag-row">
        <span class="verdict-tag ${verdictClass}">${verdictLabel}</span>
        <span class="chip">${heading(t.concept)}</span>
      </div>
      <div class="a"><strong>Model strong answer</strong>${t.q.strongAnswer}</div>
    `;
    reviewList.appendChild(item);
  });
}

// ============ MCQ feedback report ============
function renderMcqReport() {
  $('reviewTitle').innerHTML = 'Question review &amp; answers';
  $('reviewSub').innerHTML = 'Every question from this round — your pick, the correct answer, and <strong>why</strong>.';

  const total = mcqList.length;
  const correct = mcqResults.filter((r) => r.correct).length;
  const pct = Math.round((correct / Math.max(1, total)) * 100);
  const readiness = pct;

  $('scoreVal').textContent = readiness;
  const ring = $('ringFg');
  ring.style.strokeDashoffset = 326.7 - (326.7 * readiness) / 100;

  $('covVal').textContent = `${correct} / ${total}`;
  $('depthVal').textContent = `${mcqList.length * 4} options`;
  $('accVal').textContent = pct + '%';

  const verdict = verdictFor(pct);
  $('verdictTitle').textContent = `Multiple choice · ${pct}% (${correct}/${total})`;
  $('verdictText').textContent =
    verdict.text +
    ' Review every question below with its explanation — the correct reasoning is what matters, not just the letter.';

  // strengths: questions you got right (concept from explanation lead-in)
  const strengths = [];
  mcqResults.forEach((r) => {
    if (r.correct) strengths.push(`Correct on: <strong>${shorten(r.q, 80)}</strong>`);
  });
  if (strengths.length === 0) strengths.push('You attempted the set — now use the explanations below to close the specific gaps.');
  fillList('strengthsList', strengths.slice(0, 5));

  // gaps: questions you missed
  const gaps = [];
  mcqResults.forEach((r) => {
    if (!r.correct)
      gaps.push(`Missed: "<em>${shorten(r.q, 75)}</em>" — you picked <strong>${String.fromCharCode(65 + r.selected)}</strong>, correct was <strong>${String.fromCharCode(65 + r.correctIdx)}</strong>. Read the explanation.`);
  });
  if (gaps.length === 0) gaps.push('No missed questions. Solid. Keep pressure-testing with fresh edge cases to stay sharp.');
  fillList('gapsList', gaps.slice(0, 5));

  // review — every question with your answer, correct answer, explanation
  const reviewList = $('reviewList');
  reviewList.innerHTML = '';
  mcqResults.forEach((r) => {
    const item = document.createElement('div');
    item.className = 'review-item';
    const cls = r.correct ? 'strong' : 'weak';
    const label = r.correct ? 'Correct' : 'Incorrect';
    item.innerHTML = `
      <div class="q">${r.q}</div>
      <div class="tag-row">
        <span class="verdict-tag ${cls}">${label}</span>
        <span class="chip">${mcqMeta.textContent}</span>
      </div>
      <div class="a"><strong>Your answer</strong> ${makeMcqLine(r, r.selected)}</div>
      <div class="a"><strong>Correct answer</strong> ${makeMcqLine(r, r.correctIdx)}</div>
      <div class="a"><strong>Why</strong> ${r.explain}</div>
    `;
    reviewList.appendChild(item);
  });
}

function makeMcqLine(r, idx) {
  return String.fromCharCode(65 + idx) + ') ' + r.options[idx];
}

function fillList(id, items) {
  const list = $(id);
  list.innerHTML = '';
  items.forEach((it) => {
    const li = document.createElement('li');
    li.innerHTML = it;
    list.appendChild(li);
  });
}

function labelsFor(matches) {
  const map = {
    pageobject: 'page object modeling',
    lifecycle: 'test lifecycle',
  };
  return matches.map((m) => map[m] || m);
}

function heading(concept) {
  return (concept || 'concept').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function depthPercent() {
  const withFollows = transcript.filter((t) => t.followUpsUsed > 0);
  return Math.round(clamp((withFollows.length / Math.max(1, transcript.length)) * 100, 0, 100));
}

function accuracyPercent() {
  if (!transcript.length) return 0;
  const n = transcript.length;
  const base = transcript.filter((t) => t.judgment === 'strong').length / n;
  return Math.round(clamp(base * 100, 0, 100));
}

function verdictFor(score) {
  if (score >= 80)
    return { title: 'Interview-ready', text: 'Your answers were structured and technically deep. You answered like someone who has production experience. Keep sharpening edge cases and "why" questions.' };
  if (score >= 60)
    return { title: 'Nearly there', text: 'Solid fundamentals, but depth varied. Some answers would have survived a real probing interview, others need a stronger structure and more specifics.' };
  if (score >= 40)
    return { title: 'Building the foundation', text: 'You have working knowledge, but a real interviewer would push for more depth. Focus on structuring answers (concept → example → trade-off) and covering more keywords.' };
  return { title: 'Early stage', text: 'The interview showed areas that need work before a real SDET interview. Use the strong answers below as a study guide and re-take this track.' };
}

// ============ Restart / home ============
$('restartBtn').addEventListener('click', () => {
  resetToSetup();
  startBtn.disabled = true;
});
$('homeBtn').addEventListener('click', () => {
  resetToSetup();
});

function resetToSetup() {
  if (recognition && listening) recognition.stop();
  window.speechSynthesis && window.speechSynthesis.cancel();
  showScreen('setup');
  conversation.innerHTML = '';
  trackGrid.querySelectorAll('.selected').forEach((o) => o.classList.remove('selected'));
  levelRow.querySelectorAll('.selected').forEach((o) => o.classList.remove('selected'));
  updateStart();
}

// ============ Toast ============
let toastTimer;
function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
}

// ============ Util ============
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
const shorten = (s, n = 90) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Prime voices list (Chrome loads voices async)
if (synthSupported) window.speechSynthesis.getVoices();
window.speechSynthesis && window.speechSynthesis.onvoiceschanged && (window.speechSynthesis.onvoiceschanged = () => {});

// ============ Theme toggle ============
const themeToggle = $('themeToggle');
const themeLabel = $('themeLabel');
const THEME_KEY = 'preppal-theme';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
}
function initTheme() {
  const saved = (() => {
    try { return localStorage.getItem(THEME_KEY); } catch { return null; }
  })();
  const pref = saved
    || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(pref);
}
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
});
initTheme();

// ============ Copy report ============
let copyReportBtn = $('copyReportBtn');
function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-9999px';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  document.body.removeChild(ta);
  return ok;
}
copyReportBtn.addEventListener('click', async () => {
  const title = $('verdictTitle').textContent;
  const score = $('scoreVal').textContent;
  const verdict = $('verdictText').textContent;
  let text = `PrepPal report — ${title}\nScore: ${score}/100\n${verdict}\n\n`;
  $('reviewList').querySelectorAll('.review-item').forEach((item) => {
    const q = item.querySelector('.q')?.textContent || '';
    const verdicts = item.querySelectorAll('.verdict-tag');
    const v = verdicts.length ? [...verdicts].map((t) => t.textContent.trim()).join(', ') : '';
    const lines = [...item.querySelectorAll('.a')].map((a) => `  - ${a.textContent.replace(/\n+/g, ' ').trim()}`);
    text += `\n${q} [${v}]\n${lines.join('\n')}\n`;
  });
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else if (!legacyCopy(text)) {
      throw new Error('legacy copy failed');
    }
    showToast('Report copied to clipboard');
  } catch {
    showToast('Could not copy (clipboard blocked)', 'error');
  }
});

// ============ Init ============
buildSetup();
