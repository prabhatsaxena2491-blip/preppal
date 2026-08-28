// Question bank for the SDET / automation testing mock interview.
// Hand-curated — this is the moat: real questions that separate a junior
// from a senior automation engineer, organized by track and experience level.

export const TRACKS = [
  {
    id: 'playwright',
    name: 'Playwright',
    icon: 'PW',
    blurb: 'Modern browser automation, selectors, network & concurrency.',
  },
  {
    id: 'selenium',
    name: 'Selenium',
    icon: 'SE',
    blurb: 'Classic WebDriver, waits, locators, grids.',
  },
  {
    id: 'api',
    name: 'API Testing',
    icon: 'API',
    blurb: 'REST, auth, schemas, data-driven and contract testing.',
  },
  {
    id: 'framework',
    name: 'Framework Design',
    icon: 'FD',
    blurb: 'Page objects, test architecture, maintainability, abstractions.',
  },
  {
    id: 'cicd',
    name: 'CI/CD for QA',
    icon: 'CI',
    blurb: 'Pipelines, parallelism, containers, flaky-test strategy.',
  },
];

export const LEVELS = [
  { id: 'junior', name: 'Junior', detail: '0–2 yrs', weight: 1 },
  { id: 'mid', name: 'Mid-level', detail: '2–5 yrs', weight: 1.5 },
  { id: 'senior', name: 'Senior', detail: '5+ yrs', weight: 2 },
];

// Each question:
//   q            — the main question
//   followUps    — array of probe questions used for weak answers
//   strengths    — keywords a strong answer contains (for scoring & feedback)
//   strongAnswer — a model "strong answer" shown in feedback for gaps
//   concept      — the underlying concept for grouping

const QUESTIONS = {
  playwright: [
    {
      q: 'Take me through the lifecycle of a Playwright test — what happens from the moment you run it until it tears down?',
      difficulty: 'mid',
      concept: 'lifecycle',
      strengths: ['browser', 'context', 'page', 'teardown', 'isolat', 'fixture', 'launch', 'close', 'parallel'],
      followUps: [
        'Why is it important to use a fresh browser context per test rather than a single browser instance?',
        'In your setup, where do shared resources like authentication get handled — per-test or per-suite, and why?',
      ],
      strongAnswer:
        'A Playwright test launches a browser, creates an isolated browser context (fresh cookies, storage, and profile) per test, and a page within it. Setup—like a storageState login or a fixture—provides shared, fast state. The test interacts and asserts, then Playwright tears down the context so tests never leak state. Playwright runs workers in parallel, each with its own browser instance, so a full worker/context for tests that need it.',
    },
    {
      q: 'Playwright has auto-waiting. Explain what that is and why it makes tests less flaky than Selenium-style explicit waits.',
      difficulty: 'mid',
      concept: 'auto-wait',
      strengths: ['wait', 'actionabilit', 'retry', 'poll', 'auto', 'expect', 'polling', 'assertion', 'timeout', 'flaky'],
      followUps: [
        'When would you still need to write a manual expect.toPass or explicit polling, despite auto-waiting?',
        'What conditions make an element "actionable" in Playwright before it performs a click?',
      ],
      strongAnswer:
        'Auto-waiting means Playwright retries the actionability checks—visible, stable, enabled, not obscured, receiving events—until an action or assertion succeeds within a timeout window, instead of failing the first time the element is hidden. So flaky sleeps disappear. I still reach for manual waits when an assertion needs to retry over a longer window (expect.poll, expect.toPass) or when checking a value that updates asynchronously outside of typical actionability.',
    },
    {
      q: 'How would you select a stable locator for a login button? What makes a locator good versus brittle?',
      difficulty: 'junior',
      concept: 'locators',
      strengths: ['role', 'getby', 'text', 'testid', 'data-testid', 'user-facing', 'user-visible', 'stable', 'accessib', 'semantic', 'brittle', 'xpath'],
      followUps: [
        'When is it acceptable to fall back to XPath over role or text-based locators?',
        'How do you handle a selector that matches multiple elements — how do you disambiguate?',
      ],
      strongAnswer:
        'I prefer user-facing role and text locators: page.getByRole("button", { name: "Login" }) or getByTestId for app-owned hooks. These are readable, semantic, and mirror accessibility. Avoid coupling to CSS classes, indices, or generated IDs, which change constantly. Fall back to XPath only for genuinely dynamic legacy UI, and disambiguate multiple matches with .first(), .nth(), or a more specific name filter.',
    },
    {
      q: 'A test fails in CI but passes locally. Walk me through how you would debug that.',
      difficulty: 'senior',
      concept: 'flakiness',
      strengths: ['trace', 'trace-viewer', 'video', 'screenshot', 'retry', 'timeout', 'slow', 'diff', 'environment', 'log', 'network', 'headless', 'parallel'],
      followUps: [
        'How would you use the trace viewer to diagnose a timing issue specifically?',
        'What is the difference between flakiness caused by test order/parallelism versus real product regressions?',
      ],
      strongAnswer:
        'I turn on tracing and video for every CI run. With the trace viewer I replay the exact actions, network requests, and console errors, comparing the failing attempt to the retry. I check for timing mismatches, race conditions from shared state, and environment differences between CI and local. If it only fails in CI, I look at parallelism, machine slowness, or rate limiting. Only after I distinguish an environment/timing flake from a genuine regression do I choose silence-vs-fix: unstable if product is fine, raise a bug if not.',
    },
    {
      q: 'How do you run Playwright tests in parallel without them interfering with each other?',
      difficulty: 'senior',
      concept: 'parallelism',
      strengths: ['context', 'isolat', 'worker', 'project', 'shard', 'parallel', 'data', 'state', 'unique', 'fixture', 'independent'],
      followUps: [
        'What data-isolation strategy do you use so tests sharing one backend do not clobber each other?',
        'When would sharding be better than just increasing workers?',
      ],
      strongAnswer:
        'Playwright isolates state per browser context by default, so tests within a worker can still race on shared UI elements if they touch the same page—so I keep tests independent. For data, I create unique data per test run (timestamped users) and clean up in teardown. I use projects for cross-browser and sharding across CI machines when the suite is large, and I keep workers matched to CPU capacity to avoid CI machines timing out.',
    },
  ],

  selenium: [
    {
      q: 'Explain the difference between implicit and explicit waits in Selenium. Which would you prefer and why?',
      difficulty: 'junior',
      concept: 'waits',
      strengths: ['implicit', 'explicit', 'webdriverwait', 'expectedconditions', 'poll', 'timeout', 'retry', 'global', 'synchron'],
      followUps: [
        'What happens if you set both an implicit wait and an explicit wait in the same test — is there any interaction?',
        'Give an example of an ExpectedCondition you have written or used custom.',
      ],
      strongAnswer:
        'Implicit wait applies a global timeout to the driver for every element lookup. Explicit wait uses WebDriverWait with a targeted condition on a single element until a timeout. I prefer explicit waits: they are targeted, readable, and don\'t slow down every query like implicit waits can. Setting both at once can produce unpredictable, doubled timeouts, so I avoid mixing them and standardize on explicit + a fluent custom condition where needed.',
    },
    {
      q: 'What are the different locator strategies in Selenium and how do you pick between them?',
      difficulty: 'junior',
      concept: 'locators',
      strengths: ['id', 'css', 'xpath', 'class', 'name', 'text', 'priority', 'stable', 'classname', 'linktext', 'cssselector'],
      followUps: [
        'When is XPath clearly a better choice than CSS selectors?',
        'How do you handle dynamic IDs generated on every page load?',
      ],
      strongAnswer:
        'In order of preference: ID, then CSS selectors, then XPath as last resort. IDs are fastest and most stable when present. CSS is readable and fast. XPath is slower and highly dependent on DOM structure, so I use it only for navigating complex parent/child or text-based selection, or when traversing up the DOM. For dynamic IDs, I use stable attributes, relative XPath by text, or ask for data-testid hooks from development.',
    },
    {
      q: 'Explain how Selenium WebDriver communicates with the browser, including WebDriverManager and the driver lifecycle.',
      difficulty: 'senior',
      concept: 'architecture',
      strengths: ['webdriver', 'protocol', 'http', 'driver', 'chromedriver', 'binary', 'browserdriver', 'geckodriver', 'session', 'webdrivermanager', 'server', 'bidi'],
      followUps: [
        'What is the role of the W3C WebDriver protocol in that communication?',
        'Why should you always set up the drivers to match the exact browser version?',
      ],
      strongAnswer:
        'WebDriver is a remote-control interface: the test connects to a driver binary (chromedriver, geckodriver) that speaks the W3C WebDriver HTTP protocol to the browser and exposes automation as a REST-ish API. WebDriverManager resolves and downloads the matching driver binary for the installed browser version, so versions stay in sync. The driver creates a session; the test issues commands which the driver translates to browser actions. I manage this via a shared driver/factory so parallel browsers are isolated.',
    },
    {
      q: 'What is a Selenium Grid and when would you use it? How does it compare to headless mode?',
      difficulty: 'senior',
      concept: 'grid',
      strengths: ['grid', 'hub', 'node', 'remote', 'distributed', 'parallel', 'cross-browser', 'os', 'headless', 'scale', 'matrix', 'containers'],
      followUps: [
        'What are the operational costs of running a Grid versus a containerized CI runner farm?',
        'How do you decide when a Grid is genuinely worth it?',
      ],
      strongAnswer:
        'A Selenium Grid is a hub and nodes setup that lets you route tests to remote browsers on different machines and OSes, enabling parallel, cross-browser/cross-OS execution at scale. I reach for it when I need a genuine browser/OS matrix beyond a single headless runner or wants to scale horizontal execution without multiplying CI machines. It adds infrastructure cost, so for simple cross-browser needs I compare against containerized CI runners or cloud services. Headless is a fast, cheap subset—great for smoke and speed, but it cannot cover real OS differences.',
    },
    {
      q: 'How do you handle pop-ups, alerts, and new browser windows in a Selenium test?',
      difficulty: 'mid',
      concept: 'windows',
      strengths: ['alert', 'window', 'switchto', 'handles', 'accept', 'dismiss', 'tab', 'switchto().window', 'iframe', 'popup', 'getwindowhandles'],
      followUps: [
        'How do you switch to and interact with an iframe?',
        'How do you manage multiple windows when the ordering of handler handles is not guaranteed?',
      ],
      strongAnswer:
        'For alerts I use driver.switchTo().alert() to get, accept, or dismiss, and to read text. For new windows or tabs I use driver.getWindowHandles() to get all handles, switchTo().window() to the target, and I prefer identifying the correct window by its title/URL rather than assuming order. Iframes need switchTo().frame() by index, ID, or element, then switch back to default content afterward.',
    },
  ],

  api: [
    {
      q: 'What is the difference between a RESTful API call and how you verify it versus how you verify a UI action?',
      difficulty: 'junior',
      concept: 'rest-basics',
      strengths: ['status', 'header', 'json', 'schema', 'method', 'resource', 'status code', 'response', 'contract', 'url', 'endpoint'],
      followUps: [
        'How do you decide what to assert on an API response—just the status code, or more, and why?',
        'How would you combine an API test with a UI test in one flow?',
      ],
      strongAnswer:
        'An API call is deterministic and fast, so I verify much more than I do in the UI: status code, response headers, the JSON body structure via schema validation, and business data. The UI test verifies the integration layer and behavior; the API test verifies the contract and data at speed. I combine them by using API calls to set up state for a UI test, and asserting the UI reflects what the API returned.',
    },
    {
      q: 'How would you test authentication and authorization flows for a REST API?',
      difficulty: 'senior',
      concept: 'auth',
      strengths: ['token', 'jwt', 'oauth', 'basic', 'bearer', 'auth', 'refresh', 'expiry', 'role', 'scope', 'authorization', 'permission', '401', '403', 'login'],
      followUps: [
        'What are the security-focused test cases for token validity and expiry?',
        'How do you test role-based authorization without seeding dozens of accounts?',
      ],
      strongAnswer:
        'I test the happy path: obtain a token via a login endpoint, then the flow with a bearer/authorization header. Negative cases are critical: no token (401), expired token, revoked token, tampered signature, wrong role (403), and refresh-token rotation. For role-based tests I seed a small set of users per role and parameterize, or mock the auth provider, so I\'m not managing dozens of accounts per role.',
    },
    {
      q: 'What is schema validation and how do you apply it in API testing? Give tools you have used.',
      difficulty: 'mid',
      concept: 'schema',
      strengths: ['schema', 'validation', 'json schema', 'contract', 'joi', 'zod', 'jsonschema', 'aioschema', 'hamcrest', 'allure', 'snapshot', 'validation'],
      followUps: [
        'How does a schema test differ from asserting specific field values?',
        'How do you keep API schemas in sync with a quickly-evolving backend contract?',
      ],
      strongAnswer:
        'Schema validation checks the structure and types of a response—required and optional fields, types, enums, ranges—not specific values. I use libraries like JSON Schema, joi/zod, or language schema validators and assert the whole body conforms. It catches contract drift fast when the backend adds or breaks a field. It differs from value assertions, which check business correctness on specifics. To stay in sync, I generate or import contracts from the service (OpenAPI/contract tests) and run schema checks in CI per release.',
    },
    {
      q: 'Explain a data-driven API test framework. How do you parameterize test data and expected responses?',
      difficulty: 'mid',
      concept: 'data-driven',
      strengths: ['data-driven', 'paramet', 'csv', 'json', 'external', 'fixture', 'dataset', 'loop', 'table', 'cases', 'environments', 'property'],
      followUps: [
        'Where do you store expected responses, and how do you handle environments with different data?',
        'How do you avoid data-driven tests becoming thousands of near-duplicate cases?',
      ],
      strongAnswer:
        'A data-driven framework separates test scenarios from test logic. I load cases from external sources—CSV, JSON, DB, or property files—so one executor handles many inputs and expected outputs. This lets me run the same flow against different data sets and environments by swapping the data source. I keep environments isolated by using environment-specific config and only assert on fields tied to that environment. I curate cases by risk rather than brute-force enumerating every permutation.',
    },
    {
      q: 'How would you test API performance or contract stability — e.g., a breaking change that still returns 200?',
      difficulty: 'senior',
      concept: 'contract',
      strengths: ['contract', 'breaking', 'drift', 'pact', 'openapi', 'swagger', 'version', 'publisher', 'consumer', 'real regress', 'monitor', 'changes'],
      followUps: [
        'What is contract testing and how does it prevent "still 200 but data broken" regressions?',
        'How do you integrate contract checks into a deployment pipeline?',
      ],
      strongAnswer:
        'A 200 with subtly changed payload is the classic silent break. I layer contract tests (Pact-style consumer-driven contracts or OpenAPI schema regressions) into CI so consumers verify the provider still meets their expected contract before deploy. That catches field rename/removal/type changes early. I also run smoke plus performance/load checks periodically, and monitor response times and payload drift in non-prod after each build.',
    },
  ],

  framework: [
    {
      q: 'Design a test automation framework from scratch for a new web app. Walk me through the layers and key decisions.',
      difficulty: 'senior',
      concept: 'design',
      strengths: ['pageobject', 'page object', 'abstraction', 'layers', 'config', 'fixture', 'helper', 'reporting', 'parallel', 'reuse', 'maintainable', 'basetest', 'separat', 'single responsibility'],
      followUps: [
        'How do you structure page objects so a UI change touches only one place?',
        'How do you decide what lives in a base test class versus a helper versus a page object?',
      ],
      strongAnswer:
        'I start with a layered architecture: page objects encapsulate locators and interactions for a screen; a base test/fixture handles setup, driver lifecycle, config, and reporting hooks; reusable helpers handle common actions like login or waits; and test logic stays thin and behavior-focused. Config comes from environment variables, not hardcoded values. I separate concerns so a single selector or UI change touches exactly one page object, not scattered tests. I design for parallelism and data isolation from day one.',
    },
    {
      q: 'Explain the Page Object Model. What problem does it solve and what are its downsides?',
      difficulty: 'junior',
      concept: 'page-object',
      strengths: ['page object', 'locator', 'reuse', 'maintenance', 'encapsul', 'refactor', 'abstraction', 'single place', 'reusab', 'collaps', 'duplicat'],
      followUPs: [],
      followUps: [
        'How would you handle a page object that grows too large and becomes a "god object"?',
        'What is the difference between a page object and a component/abstract page object for shared UI?',
      ],
      strongAnswer:
        'Page Object Model wraps a page\'s structure into a class that exposes user-visible actions and returns the page objects of where those actions lead. It solves duplication and cost of change: when a locator or layout changes, you fix one class, not every test. Downsides: they can become god objects holding everything, and misuse can produce over-abstracted, hard to read code. I mitigate by splitting shared components into base/component page objects and keeping actions behavior-focused.',
    },
    {
      q: 'How do you handle test data in a framework — creating, reusing, and cleaning it up reliably?',
      difficulty: 'mid',
      concept: 'data',
      strengths: ['fixture', 'setup', 'teardown', 'cleanup', 'unique', 'isolat', 'random', 'timestamp', 'seed', 'database', 'api', 'state', 'transaction', 'reset'],
      followUps: [
        'How do you make data setup fast and deterministic instead of slow UI-driven flows?',
        'What is your cleanup strategy so test data does not accumulate?',
      ],
      strongAnswer:
        'I prefer API or direct database seeding for setup because it is fast and deterministic versus slow UI flows. Data is made unique per run (timestamp/user) to avoid collisions under parallelism, and cleaned up in teardown: delete via API, DB, or fixture-based rollback. I keep a reset/transaction strategy so leftover data cannot break the next run. The goal is fully isolated, self-created state per test that goes away after.',
    },
    {
      q: 'Your suite has 1,000 tests and takes 2 hours. How do you make it faster and more reliable?',
      difficulty: 'senior',
      concept: 'perf-reliability',
      strengths: ['parallel', 'shard', 'retry', 'flaky', 'smoke', 'tag', 'prioritize', 'optimize', 'headless', 'hierarchy', 'pipeline', 'stable', 'rerun'],
      followUps: [
        'How do you decide which tests to run on every commit versus nightly?',
        'What is your process for triaging flaky tests so they stop eroding trust in the suite?',
      ],
      strongAnswer:
        'I first make it parallel across workers and shard across CI machines, since that buys the most time. I cut slow, flaky, or redundant tests, break the suite by tier: smoke on every commit, regression nightly, and heavy/integration on-demand. For reliability, any flaky test gets tracked—trace, screenshot, retry policy—and I disable-fix-reenable rather than letting flakes silently pass. I replace slow end-to-end UI coverage with fast API/unit layers where they give equal value.',
    },
    {
      q: 'How do you make tests maintainable so a junior engineer can confidently contribute without breaking the suite?',
      difficulty: 'mid',
      concept: 'maintainability',
      strengths: ['naming', 'readab', 'convention', 'code review', 'lint', 'documentation', 'small', 'single responsibility', 'standards', 'review', 'consistent', 'structure'],
      followUps: [
        'What coding conventions or review standards would you enforce in an automation codebase?',
        'How do you balance readable tests against the abstraction layers discussed earlier?',
      ],
      strongAnswer:
        'Readability and conventions: consistent naming, small focused tests that read like behavior, unified locator and page-object patterns, linting/formatting, and code review in the CI loop. The abstractions (base classes, page objects, and helpers) are documented and reviewed so they stay thin. I review every automation PR like product code, enforce a test pyramid, and keep a short onboarding doc so new engineers extend existing patterns instead of inventing new ones.',
    },
  ],

  cicd: [
    {
      q: 'Design a CI/CD pipeline for a test automation suite. What stages would you include and in what order?',
      difficulty: 'mid',
      concept: 'pipeline',
      strengths: ['lint', 'unit', 'build', 'stage', 'smoke', 'regression', 'artifacts', 'report', 'deploy', 'parallel', 'cache', 'gate', 'security', 'notify'],
      followUps: [
        'Where in the pipeline do you run tests relative to deployment, and why?',
        'How do you gate a release on tests without blocking developers on a slow suite?',
      ],
      strongAnswer:
        'I build a staged pipeline: lint and unit test fast on every commit; build/package with caching; deploy to a test environment; run a fast smoke suite as a gate; then run the broader regression suite (often nightly or in parallel shards) and publish reports and artifacts. Tests gate the deployment to higher environments. I use a fast smoke gate so developers get feedback quickly, and the long regression runs without blocking commits.',
    },
    {
      q: 'A test suite runs in CI but the execution environment is different from your machine. How do you keep it reproducible?',
      difficulty: 'senior',
      concept: 'containers',
      strengths: ['docker', 'container', 'image', 'reproduc', 'lock', 'version', 'pin', 'dependency', 'deterministic', 'environment', 'cache', 'ci', 'runner', 'orchestrat'],
      followUps: [
        'How do you pin browser and driver versions so CI is deterministic?',
        'What are the trade-offs of running tests in Docker versus on a CI runner directly?',
      ],
      strongAnswer:
        'I run the suite and its browsers/drivers inside Docker containers, pinning exact image tags and locking the dependency versions so the environment is reproducible. CI and local both use the same image, eliminating environment drift. I cache dependencies and browser downloads for speed. Trade-off is added setup complexity and time, but determinism and reduced flaky "works on my machine" outweigh it. I pin browser+driver versions together to avoid mismatch.',
    },
    {
      q: 'How do you handle flaky tests in CI so they do not block the pipeline but also get fixed?',
      difficulty: 'mid',
      concept: 'flaky',
      strengths: ['retry', 'tag', 'quarantin', 'track', 'report', 'stability', 'threshold', 'flaky', 'alert', 'fix', 'rery', 'stale', 'owner'],
      followUps: [
        'What is the difference between a retry policy and actually fixing the root cause?',
        'How do you measure and report suite stability over time?',
      ],
      strongAnswer:
        'I separate masking from fixing: a retry policy (e.g., retry once on failure with trace enabled) keeps the pipeline moving, but I track every re-run and flag tests that fail-then-pass as flaky. I quarantine flaky tests, open a ticket with owner, trace/video evidence, and fix the root cause before re-enabling. I report suite stability as a metric (pass rate, flake rate) over time so the team sees whether reliability is trending up.',
    },
    {
      q: 'How do you parallelize and speed up the CI test run — and how do you decide the right amount of parallelism?',
      difficulty: 'senior',
      concept: 'parallelism',
      strengths: ['parallel', 'shard', 'worker', 'matrix', 'load', 'cache', 'time', 'split', 'concurrent', 'runner', 'cloud', 'balanced'],
      followUps: [
        'When do you prefer sharding across machines over just more workers on one machine?',
        'How do you avoid over-parallelizing and causing resource contention that slows things down?',
      ],
      strongAnswer:
        'I use parallel workers within a runner plus sharding across runners for larger suites, splitting by test count or duration-balanced so no shard is the long tail. I match parallelism to CI CPU/memory to avoid contention—too many parallel tests on a small runner is slower, not faster. I cache dependencies and intermediate artifacts. I pick the split based on measured wall-clock per shard and cost of CI minutes.',
    },
    {
      q: 'How would you add reporting and notifications to CI so failures are acted on quickly?',
      difficulty: 'junior',
      concept: 'reporting',
      strengths: ['report', 'allure', 'junit', 'slack', 'notification', 'artifact', 'dashboard', 'trend', 'attach', 'screenshot', 'trace', 'log', 'email', 'fail fast'],
      followUps: [
        'What goes into a great failure report that helps a developer triage immediately?',
        'How do you surface suite-wide trends to leadership or the team?',
      ],
      strongAnswer:
        'Each run publishes an HTML report (e.g., Allure) with trace, video, screenshots, logs, and the exact failing assertion, and stores it as a CI artifact. Notifications go to Slack/teams on failure with a link to the report and the failing test name, so a developer jumps straight to the evidence. I keep a trend dashboard of pass rate and flake rate over time to catch slow degradation, not just single failures.',
    },
  ],
};

// Level tiers — which question difficulties to favour at each experience level.
// The same mapping is used for both voice and multiple-choice modes so a Junior
// always gets easier questions and a Senior gets the discriminating ones.
export const LEVEL_TIER = {
  junior: ['junior', 'mid'],
  mid: ['mid', 'junior', 'senior'],
  senior: ['senior', 'mid'],
};

export function getSession(trackId, levelId, numQuestions = 4) {
  const track = TRACKS.find((t) => t.id === trackId);
  const level = LEVELS.find((l) => l.id === levelId);
  const pool = QUESTIONS[trackId] || [];
  // Deterministic-ish shuffle so repeat sessions differ but stay relevant.
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  // Level-aware: prefer questions at the level's tier first, then top up with
  // the rest so we always return the requested count even on small pools.
  const tier = LEVEL_TIER[levelId] || ['mid'];
  const inTier = shuffled.filter((q) => tier.includes(q.difficulty));
  const rest = shuffled.filter((q) => !tier.includes(q.difficulty));
  const ordered = [...inTier, ...rest];
  return {
    track,
    level,
    questions: ordered.slice(0, numQuestions),
  };
}

export { QUESTIONS };
