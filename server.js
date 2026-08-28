import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getWebQuestions, getWebMcqs } from './src/interview-questions.js';
import { TRACKS, getSession } from './public/interview/question-bank.js';
import { MCQS } from './public/interview/mcq-bank.js';
import { trackPageHtml, aboutPageHtml, sitemapXml, robotsTxt } from './src/landing-pages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));

// Single source of truth for the canonical domain. Landing/About/sitemap/robots
// already read this; index.html is static so we inject it server-side here.
const BASE = process.env.PREPPAL_URL || 'https://preppal.app';
const indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'interview', 'index.html'), 'utf8');
const renderIndex = () => indexHtml.replaceAll('__PREPPAL_URL__', BASE);

// The app index — served BEFORE static so the real domain is injected into the
// canonical/og/ld+json tags (a hardcoded placeholder would mislead Google).
// Express is non-strict by default, so "/interview" also matches "/interview/".
// We inspect originalUrl to avoid an infinite redirect loop.
// Redirect /interview -> /interview/ so relative asset paths resolve correctly.
app.get('/interview', (req, res) => {
  if (req.originalUrl.startsWith('/interview/')) {
    res.set('Cache-Control', 'no-store');
    return res.type('html').send(renderIndex());
  }
  const qs = req.url.includes('?') ? `?${req.url.split('?').slice(1).join('?')}` : '';
  return res.redirect(301, `/interview/${qs}`);
});
app.get('/interview/index.html', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(renderIndex());
});
app.get('/interview/', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(renderIndex());
});

// Never let the browser cache interview assets — stale JS caused a "answers are
// appended" bug that only vanished after a hard refresh.
app.use('/interview', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Naive per-IP rate limiter: 20 API requests per minute.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const hits = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of hits) {
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    if (recent.length > 0) hits.set(ip, recent);
    else hits.delete(ip);
  }
}, WINDOW_MS).unref();

// About Us page — registered before the track route so "about" is not treated
// as a track id (it would otherwise 301 to the home page).
app.get('/interview/about', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.type('html').send(aboutPageHtml());
});

// Crawlable SEO landing pages — one per track. Registered AFTER the static
// middleware so real files win; these are generated HTML for search engines.
app.get('/interview/:trackId', (req, res) => {
  const track = TRACKS.find((t) => t.id === req.params.trackId);
  if (!track) {
    return res.redirect(301, '/interview/');
  }
  const html = trackPageHtml(track);
  if (!html) return res.redirect(301, '/interview/');
  res.set('Cache-Control', 'public, max-age=3600');
  res.type('html').send(html);
});

// Search-engine crawl map and directives.
app.get('/sitemap.xml', (_req, res) => {
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.send(sitemapXml(TRACKS));
});
app.get('/robots.txt', (_req, res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(robotsTxt());
});

app.use('/api', (req, res, next) => {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }
  recent.push(now);
  hits.set(req.ip, recent);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Fresh (web-sourced) SDET interview questions for the voice mode, with a
// guaranteed seeded fallback so the interview always works offline.
app.get('/api/questions', async (req, res) => {
  const trackId = req.query.track;
  const levelId = req.query.level || 'mid';
  const count = Math.min(10, Math.max(1, Number(req.query.count) || 4));

  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) {
    return res.status(400).json({ error: `Unknown track "${trackId}". Valid: ${TRACKS.map((t) => t.id).join(', ')}.` });
  }

  let questions = null;
  let source = 'seeded';
  try {
    // Level-aware: the web pool is ordered so this level's difficulty tier
    // comes first (Junior -> easier, Senior -> the discriminating ones).
    questions = await getWebQuestions(trackId, count, levelId);
    if (questions && questions.length) source = 'web';
  } catch {
    questions = null;
  }

  if (!questions) {
    // Seeded fallback: getSession is now level-aware (tier-ordered by difficulty).
    const fallback = getSession(trackId, levelId, count);
    questions = fallback.questions.slice(0, count);
  }

  res.json({ track: { id: track.id, name: track.name }, level: levelId, count: questions.length, source, questions });
});

// Fresh (web-sourced) multiple-choice questions, synthesized from the fetched
// Q&A. Falls back to the hand-seeded MCQ bank so every track always works.
app.get('/api/mcqs', async (req, res) => {
  const trackId = req.query.track;
  const count = Math.min(20, Math.max(1, Number(req.query.count) || 10));
  const levelId = req.query.level || 'mid';

  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) {
    return res.status(400).json({ error: `Unknown track "${trackId}". Valid: ${TRACKS.map((t) => t.id).join(', ')}.` });
  }

  let mcqs = null;
  let source = 'seeded';
  try {
    // Level-aware: web pool is ordered by the chosen tier (Junior -> easier).
    mcqs = await getWebMcqs(trackId, count, levelId);
    if (mcqs && mcqs.length) source = 'web';
    else mcqs = null;
  } catch {
    mcqs = null;
  }

  if (!mcqs) {
    // Seeded MCQs have hand-tagged difficulty; the client applies MCQ_TIER
    // filtering before serving, so we return the full seeded set here.
    mcqs = (MCQS[track.id] || []).slice(0, count);
  }

  res.json({ track: { id: track.id, name: track.name }, count: mcqs.length, source, questions: mcqs });
});

app.listen(PORT, () => {
  console.log(`PrepPal running at http://localhost:${PORT}`);
});
