// Backend source of fresh interview questions for the SDET mock interview.
//
// We fetch clean, structured Q&A markdown from the public
// "boobalakrishnan89/sdet-interview-prep" repository and parse it into the
// same shape the frontend already understands (q / concept / strengths /
// followUps / strongAnswer). Every track has a seeded local fallback, so the
// interview keeps working even when the network or upstream is unavailable.
//
// The CI/CD markdown source is lower quality (repetitive boilerplate), so we
// keep cicd questions on the seeded bank and only source the well-structured
// tracks from the web.

const BASE = 'https://raw.githubusercontent.com/boobalakrishnan89/sdet-interview-prep/main';

// trackId -> raw README path for that track.
const WEB_SOURCES = {
  playwright: `${BASE}/04-playwright/README.md`,
  selenium: `${BASE}/03-selenium-webdriver/README.md`,
  api: `${BASE}/09-api-testing-fundamentals/README.md`,
  framework: `${BASE}/21-design-patterns/README.md`,
  // cicd intentionally omitted — its public source is repetitive and low quality.
};

const STOPWORDS = new Set(
  (
    'a an the and or but if then else for of to in on at by with from as is are was were be been being ' +
    'it its this that these those i you we they he she them their your our his her ' +
    'can could should would may might will shall must do does did have has had ' +
    'not no nor so very just about what which who whom how where when why ' +
    'using used use uses via through into over under between more most some any all' +
    'testing test tests automated automation'
  ).split(/\s+/)
);

// Parse Q&A blocks out of a track README. Returns array of
// { q, concept, strengths, followUps, strongAnswer } or [] on failure.
function parseMarkdown(raw, fallbackConcept) {
  const lines = String(raw || '').split(/\r?\n/);
  const blocks = [];
  let current = null;

  const flush = () => {
    if (current && current.q && current.answer) blocks.push(current);
    current = null;
  };

  for (const line of lines) {
    const qMatch = line.match(/^###\s*Q\d+[.)]?\s*(.+)$/i);
    if (qMatch) {
      flush();
      const diffMatch = qMatch[1].match(/Difficulty:\s*([^\]]+)\]/i);
      const title = qMatch[1]
        .replace(/\s*⭐\s*\[Difficulty:[^\]]*\]/i, '')
        .replace(/\s*\[Difficulty:[^\]]*\]/gi, '')
        .replace(/\*\*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      current = {
        q: title.replace(/[.!?]\s*$/, '?'),
        concept: fallbackConcept,
        // Raw source tag kept only for reference; shapeQuestion estimates
        // difficulty from content instead (the tags skew heavily to senior).
        difficulty: diffMatch ? diffMatch[1].trim() : '',
        answer: '',
        keyPoints: [],
        followUps: [],
      };
      continue;
    }
    if (!current) continue;

    if (/^\*\*Answer:\*\*\s*$/i.test(line.trim()) || line.trim().startsWith('**Answer:**')) {
      current.inAnswer = true;
      current.inKeyPoints = false;
      current.inFollow = false;
      current.answer = line.replace(/^\*\*Answer:\*\*\s*/i, '');
      continue;
    }
    if (/^\*\*Key Points:\*\*\s*$/i.test(line.trim())) {
      current.inAnswer = false;
      current.inKeyPoints = true;
      current.inFollow = false;
      continue;
    }
    if (/^\*\*Follow-up Questions:\*\*\s*$/i.test(line.trim())) {
      current.inAnswer = false;
      current.inKeyPoints = false;
      current.inFollow = true;
      continue;
    }
    // Code fences reset the paragraph context (skip their content).
    if (/^\s*```/.test(line)) {
      current.inCode = !current.inCode;
      continue;
    }
    if (current.inCode) continue;

    if (current.inAnswer) {
      if (/^\*\*Key Points:\*\*/.test(line.trim()) || /^\*\*Code Example:\*\*/.test(line.trim()) || /^\*\*Real Interview Tip:\*\*/.test(line.trim())) {
        current.inAnswer = false;
        continue;
      }
      const cleaned = line.replace(/^\*\*Answer:\*\*\s*/i, '').trim();
      if (cleaned) current.answer += (current.answer ? ' ' : '') + cleaned;
      continue;
    }
    if (current.inKeyPoints) {
      const bullet = line.replace(/^\s*[-*]\s*/, '').trim();
      if (bullet) current.keyPoints.push(bullet);
      continue;
    }
    if (current.inFollow) {
      const bullet = line.replace(/^\s*[-*]\s*/, '').trim();
      if (bullet && /[?]/.test(bullet)) current.followUps.push(bullet);
      else if (bullet) current.followUps.push(bullet + '?');
      continue;
    }
  }
  flush();

  return blocks
    .filter((b) => {
      if (!b.answer) return false;
      if (b.answer.length < 40) return false;
      // Reject the low-quality repetitive boilerplate pattern if it ever appears.
      if (b.answer.includes('Definition and principles') || b.answer.includes('is fundamental in the modern software')) return false;
      return true;
    })
    .map((b) => shapeQuestion(b, fallbackConcept))
    .filter(Boolean);
}

function shapeQuestion(block, fallbackConcept) {
  const answer = block.answer.replace(/\s+/g, ' ').trim();
  if (!answer) return null;

  const concept = slug(sanitizeConcept(block.q) || fallbackConcept);
  const strongAnswer = cap(answer, 480);

  // Derive searchable strengths from the question, the key points, and the
  // answer's most frequent meaningful terms. The frontend matches these as
  // case-insensitive substrings, so plain single words work well.
  const fromQuestion = keywords(block.q);
  const fromKeyPoints = block.keyPoints.slice(0, 6).flatMap((k) => keywords(k));
  const fromAnswer = topTerms(answer, 8);

  const strengths = dedupe([...fromQuestion, ...fromKeyPoints, ...fromAnswer])
    .map((w) => w.toLowerCase())
    .slice(0, 14);

  return {
    q: block.q,
    concept,
    // Difficulty is estimated from content (the web source's own tags skew
    // heavily toward "senior" and often omit junior entirely), so experience
    // levels get meaningfully different questions.
    difficulty: estimateDifficulty(block.q, answer),
    strengths: strengths.length ? strengths : ['concept'],
    followUps: block.followUps.slice(0, 2),
    strongAnswer,
    // Uncap answer kept for the MCQ report's full model answer.
    __fullAnswer: answer,
  };
}

// Difficulty is estimated from the question's concept sophistication. The web
// sources are how-to style and skew uniformly "mid", so we rank by which kind
// of concept each question targets rather than trusting the source tag.
const JUNIOR_Q_TERMS = [
  'what is', 'what are', 'definition', 'difference', 'introduction', 'basic', 'overview', 'first', 'feature',
  'baseurl', 'file upload', 'dialog', 'alert', 'prompt', 'download', 'locator', 'click', 'hover', 'mobile',
  'electron', 'simple', 'navigation', 'open a page', 'browser launch', 'element', 'select', 'check box',
  'right click', 'double click', 'new page', 'open url',
];
const SENIOR_Q_TERMS = [
  'architect', 'interface', 'strategy', 'parallel', 'shard', 'worker', 'performance', 'scale', 'optimiz',
  'auth', 'state reuse', 'session', 'token', 'mock', 'intercept', 'route', 'component', 'custom matcher',
  'fixture', 'test.info', 'dynamically', 'trace', 'snapshot', 'baseline', 'pact', 'contract', 'orchestrat',
  'concurrency', 'flaky', 'race', 'distribution', 'grid', 'ci integration', 'continuous', 'reliable',
  'debugging', 'deep', 'maintainab', 'trade-off', 'monitor', 'load', 'exploratory', 'model-based',
];

function estimateDifficulty(q, answer) {
  const qText = String(q).toLowerCase();
  const full = `${q} ${answer}`.toLowerCase();

  let junior = 0;
  for (const t of JUNIOR_Q_TERMS) if (qText.includes(t)) junior++;

  let senior = 0;
  for (const t of SENIOR_Q_TERMS) if (qText.includes(t)) senior++;

  // Longer answers hint at richer explanation, a mild senior nudge.
  const words = String(answer).split(/\s+/).length;
  if (words > 130) senior += 1;

  // A clearly senior concept always wins over general phrasing.
  if (senior >= 2) return 'senior';
  if (senior >= 1 && junior === 0) return 'senior';
  if (junior >= 1 && senior === 0) return 'junior';

  // Neither dominant: mid-grade standard feature questions.
  return 'mid';
}

function keywords(text) {
  return tokenize(text)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))
    .slice(0, 5);
}

function topTerms(text, n) {
  const counts = new Map();
  for (const w of tokenize(text)) {
    if (w.length > 3 && !STOPWORDS.has(w)) counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function tokenize(text) {
  // Keep hyphenated terms together, drop punctuation/numbers.
  return (String(text).toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || []).map((w) => w.replace(/^[-]+|[-]+$/g, ''));
}

function dedupe(arr) {
  return [...new Set(arr)];
}

function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'concept';
}

function sanitizeConcept(q) {
  // Keep the idea crisp: take the leading clause up to the first question
  // mark/comma/colon or a subordinating "how/when/why/what", then strip
  // leading question words so the concept reads as a noun phrase.
  const base = String(q || '')
    .split(/[?.]|,|—|–|:| which | when | who | how does | how do | how would | why | what happens | what are | what is /i)[0]
    .replace(/^what is |^what are |^what does |^how do |^how can |^how would |^how to |^explain |^describe |^define |^why |^when |^list |^name /i, '')
    .trim();
  return base || 'concept';
}

function cap(s, n) {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + '…';
}

// ---- Caching + fresh sampling ----

const cache = new Map(); // trackId -> parsed questions[]
const MAX_FETCH_AGE = 60 * 60 * 1000; // refresh source at most hourly

async function loadTrack(trackId) {
  const source = WEB_SOURCES[trackId];
  if (!source) return [];

  const hit = cache.get(trackId);
  if (hit && Date.now() - hit.t > MAX_FETCH_AGE) cache.delete(trackId);
  const existing = cache.get(trackId);
  if (existing) return existing.questions;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(source, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`fetch failed ${res.status}`);
    const raw = await res.text();
    const questions = parseMarkdown(raw, trackId);
    if (questions.length) {
      cache.set(trackId, { t: Date.now(), questions });
      return questions;
    }
  } catch (err) {
    // network/parse failure -> cached or empty; caller falls back to seeded.
  }
  return existing ? existing.questions : [];
}

// Fisher–Yates shuffle.
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sample `n` fresh questions for a track, preferring ones not returned
// recently so a new test-start yields different questions.
const recentMap = new Map(); // trackId -> [] of recent question text prefixes
const MAX_RECENT = 12;

// Level tiers — same mapping as the client bank so voice, web voice and MCQ
// all agree. Junior favours easy, Senior favours the discriminating questions.
const LEVEL_TIER = {
  junior: ['junior', 'mid'],
  mid: ['mid', 'junior', 'senior'],
  senior: ['senior', 'mid'],
};

export async function getWebQuestions(trackId, count = 4, levelId = 'mid') {
  const pool = await loadTrack(trackId);
  if (!pool.length) return null;

  const tier = LEVEL_TIER[levelId] || ['mid'];
  // Level-aware: prefer questions at this level's tier, then top up from the
  // rest so we always return `count` qualifying questions.
  const freshBase = pool.filter((q) => !recentMap.get(trackId)?.some((p) => prefix(q.q) === p));
  const inTier = freshBase.filter((q) => tier.includes(q.difficulty)).sort(() => Math.random() - 0.5);
  const rest = freshBase.filter((q) => !tier.includes(q.difficulty)).sort(() => Math.random() - 0.5);
  const fresh = [...inTier, ...rest];
  const used = fresh.length >= count ? fresh.slice(0, count) : null;
  const selected = used || shuffle(pool).slice(0, count);

  const recents = recentMap.get(trackId) || [];
  selected.forEach((q) => recents.push(prefix(q.q)));
  recentMap.set(trackId, recents.slice(-MAX_RECENT));

  return selected;
}

function prefix(q) {
  return String(q || '').replace(/\s+/g, ' ').slice(0, 48).toLowerCase();
}

export async function fetchWebRawForTest(trackId) {
  const source = WEB_SOURCES[trackId];
  if (!source) return null;
  const res = await fetch(source);
  if (!res.ok) return null;
  return res.text();
}

// ============ Web-sourced multiple choice ============
//
// We can't reliably fetch ready-made 4-option MCQs, so we synthesize them from
// the Q&A we already parse: the correct option is a substantive sentence from
// the question's own answer, and the distractors are real, plausible sentences
// drawn from other questions in the same track. Baited with the rarity that
// options stay topically related, these read as genuine "tough" MCQs.

// Split text into clean declarative sentences (>= MIN_WORDS words, ends with
// terminal punctuation, not a question, not containing "playwright.test" hooks).
const MIN_OPT_WORDS = 6;
const MAX_OPT_WORDS = 42;
const MAX_OPT_CHARS = 330;

function splitSentences(text) {
  const parts = String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim());
  return parts.map((s) => {
    let clean = s.replace(/\s+\.$/, '.').trim();
    if (!/[.!?]$/.test(clean)) clean += '.';
    return clean;
  }).filter((s) => {
    if (s.length < MIN_OPT_WORDS) return false;
    if (s.includes('?') || s.startsWith('What') || /^(why|how|when|who|where|which)\b/i.test(s)) return false;
    if (/\b(playwright\.test|page\.getBy|await |import |const |function |=>|console\.log)\b/.test(s)) return false;
    return true;
  });
}

// Condense a full answer into a short, whole statement (1-2 sentences) that can
// stand alone as an MCQ option: complete, concise, and free of formatting junk.
function condenseAnswer(full, maxWords = 40) {
  const sentences = splitSentences(full);
  if (!sentences.length) return null;

  // Use the most representative sentence, then append a second clarifying one
  // if it keeps us under the word budget — so the option reads as a whole answer.
  const first = pickBestOption(sentences);
  const out = [first];
  let words = first.split(/\s+/).length;
  for (const s of sentences) {
    const w = s.split(/\s+/).length;
    if (w <= 20 && w >= MIN_OPT_WORDS && words + w <= maxWords && first !== s) {
      out.push(s);
      words += w;
      break;
    }
  }
  return normalizeOption(out.join(' '));
}

// Pick the single most representative sentence for a question's correct option.
function pickBestOption(sentences) {
  if (!sentences.length) return null;
  // Filler/continuation leads read poorly as a standalone option.
  const weakLead = /^(similarly|also|however|moreover|furthermore|additionally|therefore|thus|and|but|so|for|then|while|whereas|unlike|in (addition|contrast|short)|it's? worth|this means|that means|as a result)\b/i;
  const rank = sentences
    .map((s) => ({ s, words: s.split(/\s+/).length, leadPenalty: weakLead.test(s) || /^[a-z]/.test(s) ? 3 : 0 }))
    .sort((a, b) => {
      const score = (x) => Math.abs(x.words - 12) + x.leadPenalty + (/[`]|\(|\)/.test(x.s) ? 1 : 0);
      return score(a) - score(b);
    });
  return rank[0].s;
}

function unknownWordCount(s) {
  // Rough lexical variety proxy used to avoid junk (code-y) options.
  return (String(s).match(/[a-z][a-z]{2,}/gi) || []).length;
}

function buildMcq(question, distractors) {
  // Correct option = the question's whole answer, condensed.
  const correct = condenseAnswer(question.__fullAnswer || question.strongAnswer);
  if (!correct) return null;

  // Distractors = the whole condensed answers of OTHER questions.
  const pool = [];
  for (const d of distractors) {
    const opt = condenseAnswer(d.__fullAnswer || d.strongAnswer);
    if (opt && opt !== correct && unknownWordCount(opt) >= 6) pool.push(opt);
  }

  // Prefer distractors sharing concept vocabulary with the question so they
  // read as plausible, then fill with anything else.
  let ordered = shuffle(pool).sort((a, b) => (relScore(b, question) - relScore(a, question)));
  const distract = ordered.slice(0, 3);
  if (distract.length < 3) return null; // not enough raw material -> skip

  const options = shuffle([correct, ...distract]);
  const correctIdx = options.indexOf(correct);

  return {
    difficulty: question.difficulty || 'mid',
    q: question.q,
    options,
    correct: correctIdx,
    explain: explanationFor(question),
  };
}

function relScore(option, question) {
  const qTokens = new Set(tokenize(question.q + ' ' + question.strongAnswer));
  const oTokens = tokenize(option);
  let hits = 0;
  for (const t of oTokens) if (qTokens.has(t)) hits++;
  return hits;
}

function normalizeOption(s) {
  let t = String(s || '').replace(/\s+/g, ' ').trim();
  // Reject options that are still list/formatting structures (not clean claims).
  if (t.includes('```') || t.includes('**') || t.includes('__') || t.includes(': **')) return '';
  if (t.startsWith('*') || t.startsWith('-') || t.match(/^\d+\./)) return '';
  // Strip code-style backticks and stray markers.
  t = t.replace(/`/g, '').replace(/[*_]/g, '');
  t = t.replace(/\[/g, '').replace(/\]/g, '');
  t = t.replace(/^[-*]\s*/, '');
  if (t.length > MAX_OPT_CHARS) t = cap(t, MAX_OPT_CHARS - 1);
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += '.';
  const words = t.split(/\s+/).length;
  if (words < 5 || words > MAX_OPT_WORDS) return '';
  return t;
}

function explanationFor(question) {
  // Full model answer: the complete, uncapped source answer so the report
  // teaches the concept rather than just pointing at one sentence.
  const full = question.__fullAnswer || question.strongAnswer || '';
  return full.replace(/\s+/g, ' ').trim() ||
    (question.strongAnswer || '').replace(/\s+/g, ' ').trim();
}

// Generate `count` MCQs for a track from the web pool (with a recent-rotation
// so each session sees a fresh set). Returns [] if the track has no source.
const mcqRecentMap = new Map(); // trackId -> [] of recent question prefixes
const MAX_MCQ_RECENT = 14;

export async function getWebMcqs(trackId, count = 10, levelId = 'mid') {
  const pool = await loadTrack(trackId);
  if (!pool.length) return [];

  // Rank questions with enough answer material first so we can build MCQs
  // reliably while preferring variety.
  const buildable = pool.filter((q) => splitSentences(q.strongAnswer).length >= 1);
  if (!buildable.length) return [];

  // Level-aware: order so this level's difficulty tier comes first (Junior ->
  // easier concepts, Senior -> discriminating ones) before sampling for MCQs.
  const tier = LEVEL_TIER[levelId] || ['mid'];
  const inTier = buildable.filter((q) => tier.includes(q.difficulty)).sort(() => Math.random() - 0.5);
  const rest = buildable.filter((q) => !tier.includes(q.difficulty)).sort(() => Math.random() - 0.5);
  const orderedBase = [...inTier, ...rest];

  const seen = new Set(mcqRecentMap.get(trackId) || []);
  const fresh = shuffle(orderedBase.filter((q) => !seen.has(prefix(q.q))));
  const ordered = fresh.length >= count ? fresh : shuffle(orderedBase).slice(0, count);

  const used = new Set();
  const out = [];
  for (const q of ordered) {
    // Distractors must come from questions OTHER than this one.
    const others = buildable.filter((o) => o !== q);
    if (others.length < 3) continue;
    const mcq = buildMcq(q, others);
    if (!mcq) continue;
    if (used.has(mcq.q)) continue;
    used.add(mcq.q);
    out.push(mcq);
    if (out.length >= count) break;
  }

  const recents = mcqRecentMap.get(trackId) || [];
  out.forEach((m) => recents.push(prefix(m.q)));
  mcqRecentMap.set(trackId, recents.slice(-MAX_MCQ_RECENT));

  return out;
}
