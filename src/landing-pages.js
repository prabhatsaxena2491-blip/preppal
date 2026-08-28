// Crawlable SEO landing pages for PrepPal — one per interview track.
// Served server-side so search engines see real text (the SPA itself loads
// questions client-side and is not crawlable). Each page identifies a target
// keyword (e.g. "Selenium interview questions") and links into the product.

const BASE = process.env.PREPPAL_URL || 'https://preppal-ai.com';

// Per-track editorial copy: title, headline, keyword intro, and sample topics.
const CONTENT = {
  playwright: {
    title: 'Playwright Interview Questions — Practice with a Mock Interviewer',
    headline: 'Playwright interview questions, asked by an AI that probes like a senior engineer',
    intro:
      'Playwright is the modern standard for browser automation, and interviewers dig past syntax into lifecycle, auto-waiting, locator strategy, network interception and debugging flaky tests in CI. PrepPal runs a free mock interview for the Playwright track and grades your answers against what a real senior automation lead expects — with the strong answer for every question.',
    topics: [
      'Test lifecycle & isolated browser contexts',
      'Auto-waiting vs explicit waits & flakiness',
      'Stable locators: role, text and data-testid',
      'Network mocking, fixtures and storageState',
      'Debugging CI-only failures with tracing',
    ],
    who: 'Great for QA engineers, SDETs and test-automation developers interviewing for roles that rely on Playwright.',
  },
  selenium: {
    title: 'Selenium Interview Questions — Practice with a Mock Interviewer',
    headline: 'Selenium interview questions with a grading AI interviewer',
    intro:
      'Selenium WebDriver is still asked about at nearly every automation interview — waits, locators, WebDriverWait, the exceptions hierarchy, handling dynamic UI and running on a Selenium Grid. PrepPal gives you a free mock interview on the Selenium track, then evaluates your answers and shows the model strong answer for each topic.',
    topics: [
      'Implicit vs explicit vs fluent waits',
      'Locators, XPath and dynamic elements',
      'Selenium exceptions hierarchy',
      'WebDriverWait, ExpectedConditions & flakiness',
      'Selenium Grid and parallel execution',
    ],
    who: 'Perfect for college hires, manual-to-automation converts and SDETs preparing for Selenium-heavy interview loops.',
  },
  api: {
    title: 'API Testing Interview Questions — Practice with a Mock Interviewer',
    headline: 'API testing interview questions with a probing AI interviewer',
    intro:
      'API testing skills separate strong automation engineers from the rest. Interviews cover REST semantics, authentication, schema and contract testing, idempotency, status codes and HATEOAS. Run a free API testing mock interview on PrepPal, get scored in real time, and read a strong model answer for every question you missed.',
    topics: [
      'REST, HTTP methods, status codes & idempotency',
      'Auth: Basic, OAuth and API keys',
      'Schema & contract testing (JSON Schema, OpenAPI)',
      'Data-driven tests and test data management',
      'gRPC, GraphQL and HATEOAS',
    ],
    who: 'Ideal for API testers, backend QA engineers and full-stack SDETs targeting modern API-heavy products.',
  },
  framework: {
    title: 'Test Framework Design Interview Questions — Practice with a Mock Interviewer',
    headline: 'Test framework design interview questions, graded by an AI',
    intro:
      'Senior automation roles are about architecture, not just writing tests. Expect the Page Object Model, reporting, parallel execution, dependency management, retries and maintainability trade-offs. PrepPal runs a free mock interview on framework design and scores how you structure the big architectural answers.',
    topics: [
      'Page Object Model & abstractions',
      'Parallel execution and thread safety',
      'Reporting, logging and soft assertions',
      'Retry strategies and flaky-test policy',
      'Maintainability, clarity and trade-offs',
    ],
    who: 'For SDETs and lead automation engineers interviewing for senior and staff roles where design is the bar.',
  },
  cicd: {
    title: 'CI/CD for QA Interview Questions — Practice with a Mock Interviewer',
    headline: 'CI/CD for QA interview questions with an AI evaluator',
    intro:
      'Modern SDETs own the pipeline. Interviews cover build stages, parallelism, containers, flaky-test strategy, environment provisioning and shift-left testing. Take a free CI/CD mock interview on PrepPal and get instant feedback with a model strong answer for every question.',
    topics: [
      'Pipeline design: build, test, deploy stages',
      'Parallelism, sharding and test retry policy',
      'Containers and test environments',
      'Flaky-test triage and quarantine',
      'Shift-left, quality gates and reporting',
    ],
    who: 'Great for CI engineers, DevOps-leaning SDETs and anyone interviewing for quality-engineering platform roles.',
  },
};

const ESC = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => s.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-+|-+$/g, '');

// Theme toggle — same control and logic as the app so the static pages feel
// like one product. Persists via localStorage under the same key the app uses.
const THEME_KEY = 'preppal-theme';
const THEME_BUTTON = `
    <button id="themeToggle" class="theme-toggle" type="button" aria-label="Toggle theme" title="Toggle light / dark">
      <span class="sun" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </span>
      <span class="moon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
      </span>
    </button>
`;
const THEME_SCRIPT = `
<script>
  (function () {
    var KEY = '${THEME_KEY}';
    function current() { return document.documentElement.getAttribute('data-theme'); }
    function apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
    function init() {
      var saved = null;
      try { saved = localStorage.getItem(KEY); } catch (e) {}
      var pref = saved
        || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      apply(pref);
    }
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        apply(next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
      });
    }
    init();
  })();
</script>
`;

export function trackPageHtml(track) {
  const meta = CONTENT[track.id];
  if (!meta) return null;
  const url = `${BASE}/interview/${track.id}`;

  const topicLis = meta.topics.map((t) => `<li>${ESC(t)}</li>`).join('\n        ');
  const canonicalPath = `${BASE}/interview/?track=${track.id}`;

  const questions = [
    `What does a strong answer to "${meta.topics[0].toLowerCase()}" look like?`,
    'PrepPal compares your answer to the keywords a senior interviewer listens for.',
    'How is PrepPal different from a static question list?',
    'It probes deeper on weak answers and then shows you the full model answer.',
  ];

  const faq = [
    {
      q: `What are the most common ${track.name} interview questions?`,
      a: meta.topics.join('. ') + '. PrepPal runs a realistic mock interview on these exact topics and grades your answers.',
    },
    {
      q: 'Is PrepPal really a free mock interviewer?',
      a: 'Yes — the open interview and multiple-choice modes are free, use your browser for voice, and pull fresh questions each session.',
    },
  ];
  const faqJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${ESC(meta.title)}</title>
    <meta name="description" content="${ESC(meta.intro.slice(0, 158))}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="PrepPal" />
    <meta property="og:title" content="${ESC(meta.title)}" />
    <meta property="og:description" content="${ESC(meta.intro.slice(0, 158))}" />
    <meta property="og:url" content="${url}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${ESC(meta.title)}" />
    <meta name="twitter:description" content="${ESC(meta.intro.slice(0, 158))}" />
    <link rel="icon" href="/interview/favicon.svg" />
    <link rel="stylesheet" href="/interview/landing.css" />
    <script type="application/ld+json">${faqJson}</script>
  </head>
  <body>
    ${THEME_BUTTON.trim()}
    <nav class="site-nav" aria-label="Site">
      <a class="brand" href="/interview/">PrepPal</a>
      <a class="nav-link" href="/interview/about">About</a>
    </nav>
    <main>
      <h1>${ESC(meta.headline)}</h1>
      <p class="lede">${ESC(meta.intro)}</p>
      <p class="who">${ESC(meta.who)}</p>

      <section>
        <h2>${track.name} interview topics PrepPal covers</h2>
        <ul class="topics">
          ${topicLis}
        </ul>
      </section>

      <section class="cta">
        <h2>Practice now — it takes about 10 minutes</h2>
        <p>Answer out loud or by typing. PrepPal probes weak answers and then scores you with a full report.</p>
        <a class="button" href="${canonicalPath}">Start a free ${track.name} mock interview →</a>
      </section>

      <section>
        <h2>Frequently asked questions</h2>
        ${faq.map((f) => `<h3>${ESC(f.q)}</h3><p>${ESC(f.a)}</p>`).join('\n        ')}
      </section>

      <section>
        <h2>Keep practicing</h2>
        <p>Follow these keyword links and use each as a short, calm drill before your real interview:</p>
        <p class="tags">
          ${Object.keys(CONTENT)
            .map((id) => `<a href="/interview/${id}">${CONTENT[id].title.split(' — ')[0]}</a>`)
            .join('  ')}
        </p>
      </section>
    </main>
    <footer class="site-footer">
      <p>PrepPal · calm AI mock interviews for automation engineers · <a href="/interview/">Home</a> · <a href="/interview/about">About</a></p>
      <p class="copyright">© 2026 PrepPal. All rights reserved.</p>
    </footer>
    ${THEME_SCRIPT.trim()}
  </body>
</html>`;
}

export function aboutPageHtml() {
  const url = `${BASE}/interview/about`;
  const title = 'About PrepPal — Built by an Automation Leader to Help You Prepare';
  const description =
    'PrepPal is built by a test-automation engineer with 13 years of experience in Selenium, Playwright, Cypress and WebDriverIO to help everyone practice the skills and build interview confidence.';

  const skills = [
    {
      name: 'Selenium (Java)',
      blurb: 'Deep, production-tested experience across the WebDriver API, waits, locator strategy, Grid and enterprise Java test suites.',
    },
    {
      name: 'PlaywrightJS',
      blurb: 'Modern browser automation done right — auto-waiting, fixtures, traceability and reliable CI execution.',
    },
    {
      name: 'Cypress',
      blurb: 'Fast, reliable end-to-end testing with a focus on stable, debuggable suites.',
    },
    {
      name: 'WebDriverIO',
      blurb: 'Versatile JavaScript test automation for both UI and API layers.',
    },
    {
      name: 'Leadership',
      blurb: 'Thirteen years of mentoring engineers, designing test strategy and building teams that ship quality.',
    },
  ];

  const skillBlocks = skills
    .map(
      (s) =>
        `<section><h3>${ESC(s.name)}</h3><p>${ESC(s.blurb)}</p></section>`
    )
    .join('\n      ');

  const skillTags = skills.map((s) => `<a href="/interview/">${ESC(s.name)}</a>`).join('  ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${ESC(title)}</title>
    <meta name="description" content="${ESC(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="PrepPal" />
    <meta property="og:title" content="${ESC(title)}" />
    <meta property="og:description" content="${ESC(description)}" />
    <meta property="og:url" content="${url}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${ESC(title)}" />
    <meta name="twitter:description" content="${ESC(description)}" />
    <link rel="icon" href="/interview/favicon.svg" />
    <link rel="stylesheet" href="/interview/landing.css" />
  </head>
  <body>
    ${THEME_BUTTON.trim()}
    <nav class="site-nav" aria-label="Site">
      <a class="brand" href="/interview/">PrepPal</a>
      <a class="nav-link" href="/interview/about">About</a>
    </nav>
    <main>
      <h1>About PrepPal</h1>
      <p class="lede">A calm, free mock-interview practice built on 13 years of real automation experience — so you can test your skills and gain confidence before the real thing.</p>

      <section>
        <h2>Why I built this</h2>
        <p>
          Interviewing is a skill of its own. Even a great test-automation engineer can freeze under the pressure of a live
          question, a microphone and an uncertain verdict. I built PrepPal to give every engineer a safe place to practice —
          to speak the answers out loud, get honest feedback, and walk into the room confident instead of anxious.
        </p>
        <p>
          I have been building automation systems for over 13 years and I believe the knowledge I have gained should not stay
          locked away. I built this system to share it with everyone who wants to test their skills and build the confidence
          that comes from practice.
        </p>
      </section>

      <section>
        <h2>Areas of expertise</h2>
        <p>PrepPal draws on hands-on experience across the automation stack many teams rely on:</p>
        <div class="grid">
          ${skillBlocks}
        </div>
        <p class="tags">${skillTags}</p>
      </section>

      <section>
        <h2>What PrepPal can do for you</h2>
        <p>
          Choose a track, pick your experience level and either speak or type your answers. PrepPal listens, probes your weak
          spots, and then shows you a strong model answer for every question — so each session leaves you sharper than the last.
        </p>
      </section>

      <section class="cta">
        <h2>Ready to build your confidence?</h2>
        <p>Pick a track and start a free mock interview — it takes about ten minutes, and you can practice as often as you like.</p>
        <a class="button" href="/interview/">Start practicing →</a>
      </section>
    </main>
    <footer class="site-footer">
      <p>PrepPal · calm AI mock interviews for automation engineers · <a href="/interview/">Home</a> · <a href="${url}">About</a></p>
      <p class="copyright">© 2026 PrepPal. All rights reserved.</p>
    </footer>
    ${THEME_SCRIPT.trim()}
  </body>
</html>`;
}

export function sitemapXml(tracks) {
  const urls = [`${BASE}/interview/`, `${BASE}/interview/about`];
  tracks.forEach((t) => urls.push(`${BASE}/interview/${t.id}`));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
  .join('\n')}
</urlset>
`;
}

export function robotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${BASE}/sitemap.xml
`;
}

export { slugify };
