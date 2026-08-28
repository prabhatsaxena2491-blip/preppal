// Multiple-choice question bank for the SDET mock interview.
// Each question is tagged with a difficulty so the set automatically scales
// with the candidate's experience level:
//   junior  — conceptual, definition-level, familiar to someone new
//   mid     — requires applied understanding and real-world reasoning
//   senior  — discriminating, edge-case and trade-off heavy questions
// Each has 4 options, the correct answer index, and a short explanation
// shown in the feedback report.

export const MCQ_TRACKS = ['playwright', 'selenium', 'api', 'framework', 'cicd'];

// Each item: { q, options:[4], correct:<index>, explain, difficulty }
export const MCQS = {
  playwright: [
    {
      difficulty: 'junior',
      q: 'What does Playwright primarily use to interact with and test a web application?',
      options: [
        'A real (or headless) browser through an automated, high-level API',
        'A command-line terminal emulator',
        'Static analysis of the HTML without running a browser',
        'Simulated network packets only',
      ],
      correct: 0,
      explain:
        'Playwright drives a real browser engine (Chromium/Firefox/WebKit) via a high-level API. This is the core of browser automation — it runs actual JS/DOM, not static analysis.',
    },
    {
      difficulty: 'junior',
      q: 'The `getByText()` locator in Playwright finds an element by:',
      options: [
        'Its CSS class name',
        'User-visible text content',
        'Its data-testid value',
        'Its position on the page',
      ],
      correct: 1,
      explain:
        'getByText() matches on visible text. It is a user-facing locator, distinct from getByTestId (test hooks) or type-based getByRole.',
    },
    {
      difficulty: 'junior',
      q: 'In Playwright, what is a "fixture"?',
      options: [
        'A reusable piece of test setup/teardown that can provide state like a logged-in browser',
        'The file that stores all selectors',
        'A way to take screenshots',
        'The default timeout value',
      ],
      correct: 0,
      explain:
        'Fixtures are Playwright\'s mechanism for shared, reusable setup (e.g., a page object or authenticated state) that is cleaned up automatically per test.',
    },
    {
      difficulty: 'mid',
      q: 'Which of these is the recommended idionmatic locator in Playwright?',
      options: [
        'page.locator("#login button.btn-submit")',
        'page.getByRole("button", { name: "Login" })',
        'page.$("#login-form > div > button")',
        'page.locator("//button[contains(text(), \'Log\')]")',
      ],
      correct: 1,
      explain:
        'Role and text-based, user-facing locators (getByRole/getByText/getByLabel) are the recommended, accessibility-friendly approach. CSS/XPath that depend on structure are brittle and only used as a fallback.',
    },
    {
      difficulty: 'mid',
      q: 'During parallel execution, how does Playwright keep tests isolated from each other by default?',
      options: [
        'Each test creates its own fresh browser context (fresh cookies, storage, and profile)',
        'Playwright serializes all tests that touch the same page',
        'Each test launches a brand-new operating system process',
        'Playwright rolls back the database after every test',
      ],
      correct: 0,
      explain:
        'A fresh browser context per test isolates cookies, localStorage, and profile. This is the key isolation primitive; it does not reset your backend data, so tests that share servers still need data isolation.',
    },
    {
      difficulty: 'senior',
      q: 'When Playwright auto-wait clicks an element, which condition is NOT part of its actionability checks?',
      options: [
        'The element is stable and not moving between two frames',
        'The element is visible and has a non-zero bounding box',
        'The element receives the pointer events (not covered by another element)',
        'The element has a single corresponding DOM node',
      ],
      correct: 0,
      explain:
        'Actionability checks are: visible, stable, receives events, enabled, editable, and attached. "Single DOM node" is not an actionability check — that distractor tests whether you actually know the list.',
    },
    {
      difficulty: 'senior',
      q: 'A test passes in headed mode but fails in headless CI. What is the most likely cause and best first debugging step?',
      options: [
        'A rendering/timing difference — capture a trace with the failure and inspect it in the Trace Viewer',
        'The headless browser blocks third-party cookies by default',
        'Headless mode runs JavaScript differently and should be avoided in CI',
        'The test uses a syntax that only works when a window is visible',
      ],
      correct: 0,
      explain:
        'Headed-vs-headless mismatches are almost always timing/environment related. Traces replay exact actions, network, and console so you can compare the failing attempt to the passing retry.',
    },
    {
      difficulty: 'senior',
      q: 'In a Playwright setup with webServer and baseURL config, what does the webServer option actually do during `playwright test`?',
      options: [
        'It launches a browser automation server that proxies all test traffic through a grid',
        'It auto-starts a local dev server (and waits for it to be ready) before tests run, then tears it down after',
        'It deploys your application to a remote staging environment for each run',
        'It only validates the baseURL is reachable and does nothing else',
      ],
      correct: 1,
      explain:
        'webServer launches the configured command, waits until baseURL responds (with a timeout), runs the tests, then tears the server down. This removes the "manually start the app first" step and makes CI reproducible.',
    },
    {
      difficulty: 'junior',
      q: 'What does Playwright\'s `page.goto(url)` do?',
      options: [
        'Navigates to a real URL, waiting for the page to load before continuing',
        'Only opens a blank browser tab without loading anything',
        'Simulates an HTTP request but not the rendered page',
        'Downloads the page\'s JSON configuration only',
      ],
      correct: 0,
      explain:
        'page.goto() navigates the page to a URL and waits for the load event by default. It is the primary way to open a page in a Playwright test.',
    },
    {
      difficulty: 'junior',
      q: 'What is Playwright\'s Trace Viewer used for?',
      options: [
        'Recording a water-tight video of the entire screen for marketing',
        'Replaying a test\'s actions, network requests, and console to debug a failure',
        'Compressing trace logs to save CI disk space',
        'Comparing two different browsers side-by-side',
      ],
      correct: 1,
      explain:
        'The Trace Viewer gives a detailed, replayable account of a test run — DOM snapshots, actions, network, and console — which is the standard way to debug failures.',
    },
    {
      difficulty: 'junior',
      q: 'In Playwright, `toBeVisible()` is an example of a(n):',
      options: [
        'Assertion you make against a locator',
        'Locator strategy for finding elements',
        'Browser configuration option',
        'Network interception method',
      ],
      correct: 0,
      explain:
        'expect(locator).toBeVisible() is an assertion from Playwright\'s expect library. It retries until the element is visible or the assertion times out.',
    },
    {
      difficulty: 'junior',
      q: 'Which of these would you use to log into an app once and reuse that session across tests (e.g., saved cookies/profile)?',
      options: [
        'storageState',
        'page.screenshot()',
        'a beforeEach that clears all cookies',
        'multiple parallel browser contexts per test',
      ],
      correct: 0,
      explain:
        'storageState saves and restores cookies/localStorage, letting you reuse an authenticated session across tests — a key performance pattern to avoid re-logging in every test.',
    },
    {
      difficulty: 'mid',
      q: 'How is Playwright\'s `expect` polling behavior different from a plain `element.isVisible()` in other frameworks?',
      options: [
        'expect retries the condition until a timeout instead of checking once',
        'expect does not actually check anything automatically',
        'expect only works on text content',
        'expect checks the condition exactly once then fails immediately',
      ],
      correct: 0,
      explain:
        'Playwright assertions auto-retry (within a configurable timeout) until the condition passes or times out. One-shot checks cause flaky failures when UI updates asynchronously.',
    },
    {
      difficulty: 'mid',
      q: 'To intercept and stub a network request in Playwright, which API do you use?',
      options: [
        'page.route() with a handler that fulfills/continues the request',
        'page.goto() with a URL parameter',
        'expect.poll() on the response',
        'a custom beforeEach hook only',
      ],
      correct: 0,
      explain:
        'page.route() (or page.routeFromHatch) intercepts requests so you can fulfill with mock responses, abort, or modify them — used for stubbing third-party calls or mocking unstable APIs.',
    },
    {
      difficulty: 'mid',
      q: 'In Playwright config, what do "projects" allow you to do?',
      options: [
        'Run the same test suite against multiple browsers/configurations (e.g., desktop + mobile)',
        'Store screenshots for each test in separate folders',
        'Deduplicate flaky tests automatically',
        'Deploy the app to production from the test run',
      ],
      correct: 0,
      explain:
        'Projects define named configurations — browsers, devices, viewports, baseURLs — so the same tests run across them, enabling cross-browser and responsive coverage.',
    },
    {
      difficulty: 'mid',
      q: 'What is the recommended way to wait for a specific condition that keeps failing to stabilize (e.g., a value that updates async)?',
      options: [
        'expect.poll() or expect(...).toPass() with a polling interval',
        'Repeated page.screenshot() calls in a loop',
        'await page.waitForTimeout() with a fixed large value',
        'Reloading the page a fixed number of times',
      ],
      correct: 0,
      explain:
        'expect.poll() and toPass() retry a custom assertion with a chosen polling interval — a safer, readable alternative to fixed sleeps for non-standard conditions.',
    },
    {
      difficulty: 'senior',
      q: 'Which of the following describes the difference between `page.locator()` and `page.getByText()`?',
      options: [
        'getByText matches user-visible text; locator() is a generic locator factory for CSS/XPath/role etc.',
        'locator() only works on hidden elements',
        'getByText returns plain strings instead of locators',
        'They are identical and interchangeable in every case',
      ],
      correct: 0,
      explain:
        'getByText() is a convenience that matches visible text, while locator() is the general-purpose factory for any selector strategy. Both return Locator objects; knowing when each is idiomatic matters.',
    },
    {
      difficulty: 'senior',
      q: 'A flaky test intermittently passes in CI. Which single setting, when enabled, gives you the most diagnostic power for the NEXT failure?',
      options: [
        'trace: "on-first-retry" (or "retain-on-failure") alongside a retry count',
        'headless: false in every run',
        'screenshot: "off" to reduce noise',
        'workers: 1 to avoid parallelism entirely',
      ],
      correct: 0,
      explain:
        'Capturing a trace on first retry / on failure preserves exactly what went wrong. Disabling headless or parallelism only reduces speed, not diagnostic depth, and doesn\'t preserve on-failure evidence.',
    },
    {
      difficulty: 'senior',
      q: 'When two Playwright tests run in parallel within a worker and BOTH call an API that creates the same unique user, what is the recommended fix?',
      options: [
        'Generate per-run unique data (e.g., timestamped/randomized IDs) so parallel tests don\'t collide',
        'Make one test depend on the other running first',
        'Reorder tests alphabetically so the API calls are serialized',
        'Increase the worker count to reduce contention',
      ],
      correct: 0,
      explain:
        'Parallel isolation depends on the data layer: unique per-run test data prevents collisions. Reordering, serializing, or adding workers doesn\'t fix shared-serve-data collisions.',
    },
    {
      difficulty: 'senior',
      q: 'In terms of the test pyramid, why is heavy end-to-end (E2E) Playwright coverage alone considered fragile for large suites?',
      options: [
        'E2E is slow and brittle; you should shift most fast, deterministic coverage to unit/API layers and reserve E2E for critical journeys and integration',
        'E2E is never useful and should be removed entirely',
        'E2E tests are faster than unit tests so they should be the majority',
        'The test pyramid recommends equal counts of every test type',
      ],
      correct: 0,
      explain:
        'The test pyramid argues for many fast unit/API tests and few slow E2E tests. Over-relying on E2E makes the suite slow and flaky; prioritizing stable lower layers is the senior judgement.',
    },
  ],
  selenium: [
    {
      difficulty: 'junior',
      q: 'Which of the following tools/libraries is used to work with the Selenium WebDriver API in tests?',
      options: [
        'The Selenium client library for your language (e.g., selenium-webdriver)',
        'A database migration tool',
        'A code formatter',
        'An HTTP load generator',
      ],
      correct: 0,
      explain:
        'Selenium provides language-specific client bindings (Java, Python, JS, C#, etc.) that speak the WebDriver protocol to drive browsers.',
    },
    {
      difficulty: 'junior',
      q: 'What does `driver.findElement(By.id("submit"))` return?',
      options: [
        'The first matching WebElement',
        'A list of all matching elements',
        'The page source as a string',
        'A screenshot of the element',
      ],
      correct: 0,
      explain:
        'findElement returns the first element matching the locator. findElements returns a list. This is a fundamental WebDriver API distinction.',
    },
    {
      difficulty: 'junior',
      q: 'Selenium Grid is BEST described as:',
      options: [
        'A performance testing tool that orchestrates load on multiple machines',
        'A hub-and-node architecture that routes test commands to remote browsers across machines/OSes',
        'A way to run the browser without a display for faster feedback',
        'An embedded driver manager that downloads matching driver binaries',
      ],
      correct: 1,
      explain:
        'A Grid routes WebDriver commands from a hub to nodes hosting browsers on different machines/OSes for parallel, cross-platform execution. Headless mode and WebDriverManager are different things.',
    },
    {
      difficulty: 'mid',
      q: 'What is a documented risk of setting BOTH an implicit wait and an explicit wait in the same WebDriver session?',
      options: [
        'The implicit wait overrides the explicit wait entirely and returns immediately',
        'They can compound into unpredictable, doubled wait times on element lookups',
        'It is fully supported and has no interaction',
        'It throws a compile-time error in all language bindings',
      ],
      correct: 1,
      explain:
        'Mixing both can produce doubled/unpredictable timeouts because the implicit wait applies globally to every lookup. Best practice is to use explicit waits (WebDriverWait) consistently and avoid implicit waits.',
    },
    {
      difficulty: 'mid',
      q: 'Which Selenium Wait strategy is the most correct way to handle an element that appears only after an asynchronous network call, without slowing unrelated waits?',
      options: [
        'Thread.sleep(3000) before every interaction',
        'driver.manage().timeouts().implicitlyWait(15, SECONDS) and rely on it globally',
        'Use WebDriverWait with an ExpectedCondition (e.g., elementToBeClickable) scoped to that element',
        'Set both implicit and explicit waits to the same value',
      ],
      correct: 2,
      explain:
        'A scoped WebDriverWait with an ExpectedCondition polls exactly the condition you need on that element — targeted, readable, and robust. Sleeps and global implicit waits are blunt.',
    },
    {
      difficulty: 'senior',
      q: 'Which W3C WebDriver command should you send to wait for and read a JavaScript alert?',
      options: [
        'driver.switchTo().frame() then getText()',
        'GET /session/{id}/alert/text',
        'Find the alert via XPath and read its text',
        'Wait for a new window handle to include "alert"',
      ],
      correct: 1,
      explain:
        'Via the W3C protocol, alert text is fetched with the /alert/text endpoint — in a binding this is SwitchTo().Alert().GetText(). Alerts are not DOM elements, so XPath will never find them.',
    },
    {
      difficulty: 'senior',
      q: 'Which statement about the W3C WebDriver protocol is TRUE?',
      options: [
        'The test connects directly to the browser process over a Unix socket',
        'The test talks to a driver binary that translates commands to browser automation over HTTP',
        'The browser exposes a public REST API that external tests call directly',
        'The protocol requires a Selenium Grid to function at all',
      ],
      correct: 1,
      explain:
        'WebDriver is a remote control protocol: the test talks over HTTP to a driver binary (chromedriver/geckodriver) which translates commands into browser automation. A Grid is optional for standalone runs.',
    },
    {
      difficulty: 'junior',
      q: 'Which Selenium method do you call to click a WebElement?',
      options: ['element.click()', 'element.type()', 'element.wait()', 'element.sendKeys()'],
      correct: 0,
      explain: 'element.click() performs the click. sendKeys() types text, and there is no element.type()/wait() for this purpose.',
    },
    {
      difficulty: 'junior',
      q: 'What is the correct order to set up a WebDriver in a test?',
      options: [
        'Instantiate the driver (e.g., new ChromeDriver()), use it, then quit() in teardown',
        'Open a browser, then instantiate the driver inside a loop',
        'Call driver.quit() before creating the driver',
        'Use the driver without ever quitting it',
      ],
      correct: 0,
      explain:
        'Create the driver, interact, and always quit() it (ideally in teardown/finally) to free resources and avoid orphan browser processes.',
    },
    {
      difficulty: 'junior',
      q: 'What does CSS location look like in Selenium findElement?',
      options: [
        'By.cssSelector("#id .class")',
        'By.xpath("//div")',
        'By.name("username")',
        'By.linkText("Log in")',
      ],
      correct: 0,
      explain:
        'By.cssSelector() uses CSS syntax (id, class, attribute). The others are different By strategies.',
    },
    {
      difficulty: 'mid',
      q: 'What is the recommended way to handle a file upload (input type="file") in Selenium?',
      options: [
        'Send the absolute file path to the file-input element with sendKeys()',
        'Click a system dialog and use OS-level automation for the dialog',
        'Paste a screenshot of the file into the element',
        'Upload via CSS with a fake path',
      ],
      correct: 0,
      explain:
        'For a real <input type="file">, sendKeys(absPath) directly sets the file path — the standard, robust approach. OS-level dialog automation is brittle and discouraged.',
    },
    {
      difficulty: 'mid',
      q: 'Which class in Selenium is used to build complex mouse/keyboard sequences (hover, double-click, drag-and-drop)?',
      options: [
        'Actions (e.g., new Actions(driver).moveToElement(el).perform())',
        'WebDriverWait',
        'JavascriptExecutor',
        'EventFiringWebDriver',
      ],
      correct: 0,
      explain:
        'The Actions class chains low-level input commands (move, click, double-click, drag) and performs them — the proper way to do hover/drag, not raw JS.',
    },
    {
      difficulty: 'mid',
      q: 'If `driver.findElement(By.xpath(...))` throws NoSuchElementException, which is the CORRECT first fix?',
      options: [
        'Add a WebDriverWait with an ExpectedCondition instead of failing on a one-shot findElement',
        'Add a raw sleep() of 30 seconds first',
        'Reload the page and retry blindly',
        'Switch to a different browser',
      ],
      correct: 0,
      explain:
        'The element likely renders asynchronously. Waiting via WebDriverWait/ExpectedConditions is correct; a raw sleep is brittle, reloading could lose state, and changing browsers is unrelated.',
    },
    {
      difficulty: 'mid',
      q: 'To switch into a specific iframe in Selenium, you would use:',
      options: [
        'driver.switchTo().frame(indexOrElementOrName)',
        'driver.get("iframe:" + url)',
        'element.click() on the iframe tag',
        'driver.manage().frame()',
      ],
      correct: 0,
      explain:
        'switchTo().frame() accepts an index, ID/name, or WebElement, then you must switch back to default content when done.',
    },
    {
      difficulty: 'mid',
      q: '`driver.manage().window().maximize()` is used to:',
      options: [
        'Maximize the browser window so elements are visible and interactions are more stable',
        'Increase the max timeout for all waits',
        'Enable parallel execution',
        'Upload a saved browser profile',
      ],
      correct: 0,
      explain:
        'Maximizing the window ensures elements aren\'t hidden off-viewport, a common cause of ElementNotInteractable issues.',
    },
    {
      difficulty: 'senior',
      q: 'Which best describes the risk of storing MANY brittle, deep XPath locators in a Selenium suite over time?',
      options: [
        'They break on minor DOM restructuring and are hard to maintain — prefer stable IDs/CSS and page objects',
        'XPath is always more stable than CSS and should replace it',
        'Deep XPath never needs maintenance',
        'XPath locators run faster than all CSS selectors',
      ],
      correct: 0,
      explain:
        'Tightly-coupled XPath breaks with DOM changes and is unreadable. Senior practice favors stable, semantic selectors (IDs, data-attributes, short CSS) wrapped in page objects.',
    },
    {
      difficulty: 'senior',
      q: 'How do you correctly share a browser session across parallel test threads WITHOUT introducing race conditions?',
      options: [
        'Create an isolated driver per test/thread — sharing one driver across threads causes nondeterministic failures',
        'Use one global driver accessed by all threads',
        'Use a static variable for the driver and let threads share it freely',
        'Only run one thread at a time so sharing is safe',
      ],
      correct: 0,
      explain:
        'WebDriver is designed for single-threaded use; sharing one driver across threads serializes and races on the same page. The clean pattern is one driver per test instance or thread-local.',
    },
    {
      difficulty: 'senior',
      q: 'When a Selenium suite has many slow E2E checks, which single practice most reduces maintenance AND runtime?',
      options: [
        'Replace low-value E2E steps with fast, deterministic API-level checks and keep E2E for critical journeys',
        'Add more sleeps to every step',
        'Run every scenario twice to average out flakes',
        'Disable all waits so tests finish faster',
      ],
      correct: 0,
      explain:
        'Shifting redundant E2E checks to API/unit layers (the test pyramid) cuts runtime and flakiness while keeping the highest-value journeys at E2E. Sleeps and double-runs don\'t reduce cost.',
    },
    {
      difficulty: 'junior',
      q: 'Which pair should you use to navigate BACK/FORWARD in Selenium?',
      options: [
        'driver.navigate().back() and driver.navigate().forward()',
        'driver.get("back") and driver.get("forward")',
        'element.back() and element.forward()',
        'driver.window().history(-1)',
      ],
      correct: 0,
      explain: 'Navigation is done via driver.navigate().back()/.forward(); driver.get() loads a URL and does not go back/forward.',
    },
    {
      difficulty: 'senior',
      q: 'Which statement about page objects in a Selenium framework is TRUE?',
      options: [
        'They centralize locators and interactions so a UI change affects one class instead of scattered tests',
        'They must contain all test assertions for a page',
        'They run faster than locators stored in test methods',
        'They are only useful when using XPath',
      ],
      correct: 0,
      explain:
        'Page objects encapsulate a page\'s locators and actions in one class, so UI changes are localized. Assertions belong in tests, and page objects aren\'t about speed or XPath specifically.',
    },
  ],
  api: [
    {
      difficulty: 'junior',
      q: 'Which HTTP status code means the request was successful?',
      options: ['200 OK', '404 Not Found', '500 Internal Server Error', '301 Moved Permanently'],
      correct: 0,
      explain: '200 is the success status. 404 means not found, 500 is a server error, and 301 is a redirect.',
    },
    {
      difficulty: 'junior',
      q: 'Which of the following is the correct status-code expectation for a valid authenticated request to a protected resource that the user is NOT authorized to access?',
      options: ['401 Unauthorized', '403 Forbidden', '400 Bad Request', '422 Unprocessable Entity'],
      correct: 1,
      explain:
        '401 = authentication failed/present (who are you), 403 = authenticated but forbidden (are you allowed?). An authenticated user lacking permission → 403.',
    },
    {
      difficulty: 'junior',
      q: 'What is a REST API response typically made up of that a tester should validate?',
      options: [
        'Status code, response headers, and a body (often JSON)',
        'Only the URL',
        'Only the HTTP method used',
        'The server\'s file system layout',
      ],
      correct: 0,
      explain:
        'A complete API verification covers status code, headers, and the response body structure/values — not just that a call "worked".',
    },
    {
      difficulty: 'mid',
      q: 'When a single API test flow drives MANY input/expected-output case pairs loaded from a CSV or JSON file, this is called:',
      options: ['Test mocking', 'A data-driven test (parameterized test)', 'Chaos testing', 'A contract test'],
      correct: 1,
      explain:
        'Data-driven testing separates test logic from test data, loading cases from an external source so one executor runs many parameterized scenarios.',
    },
    {
      difficulty: 'mid',
      q: 'When submitting an API test suite, which combination gives the BEST coverage signal for a fresh backend release?',
      options: [
        'Only happy-path status-code assertions on every endpoint',
        'Status codes + schema validation + key business-value assertions + a few negative/auth cases',
        'A single, very long end-to-end UI test that calls every endpoint',
        'Load testing every endpoint at the same concurrency',
      ],
      correct: 1,
      explain:
        'You want contract (schema), behavior (business values), and negative/auth coverage layered together. Happy-path-only misses silent breaks; UI-only misses speed and isolation.',
    },
    {
      difficulty: 'senior',
      q: 'A backend change makes an endpoint still return HTTP 200 but removes a field your UI depends on. When would your API tests still PASS while the bug ships?',
      options: [
        'When the tests only assert status codes and never validate the response body schema or fields',
        'When the tests are written in JavaScript rather than Java',
        'When the endpoint is called with a GET instead of POST',
        'When the tests run against production rather than a staging environment',
      ],
      correct: 0,
      explain:
        'A 200 with a changed payload is the classic silent break. Asserting only status codes blesses any response shape. Schema validation + field/value assertions and consumer contract tests catch this before it ships.',
    },
    {
      difficulty: 'senior',
      q: 'Contract testing (e.g., Pact) primarily protects against which failure mode?',
      options: [
        'Slow response times under load',
        'A provider still returning 200 but breaking the shape/type a consumer depends on',
        'Authentication tokens expiring mid-test',
        'Duplicate test data across parallel runs',
      ],
      correct: 1,
      explain:
        'Consumer-driven contract tests verify the provider\'s responses still satisfy the consumer\'s expected contract, catching field renames, type changes, and removals — "still 200 but data broken" regressions — before deploy.',
    },
  ],
  framework: [
    {
      difficulty: 'junior',
      q: 'What is the main purpose of a Page Object Model (POM)?',
      options: [
        'To store screenshots for every page',
        'To separate UI/page details (locators & actions) from test logic so a UI change touches one place',
        'To make tests run faster',
        'To generate HTML reports automatically',
      ],
      correct: 1,
      explain:
        'POM encapsulates a page\'s structure and actions in a class. Tests stay thin, and when a locator changes you fix one place instead of every test.',
    },
    {
      difficulty: 'junior',
      q: 'Which folder/file SHOULD NOT contain hardcoded values like URLs and credentials in a good test framework?',
      options: [
        'A config file populated from environment variables',
        'Scattered inside individual test methods',
        'A single environment config module',
        'The CI secrets store',
      ],
      correct: 1,
      explain:
        'Hardcoding URLs/credentials in tests makes them brittle and environment-dependent. Centralize config and source it from environment variables / secrets so tests work across environments.',
    },
    {
      difficulty: 'mid',
      q: 'In a well-structured Page Object Model, where should complex, real-user interactions (e.g., a login flow) live?',
      options: [
        'Inside each individual test method',
        'In a reusable component/page object method that returns the resulting page object',
        'In the test runner\'s configuration file',
        'Scattered across helper classes per test',
      ],
      correct: 1,
      explain:
        'Page objects should expose behavior-level methods that return resulting page objects (e.g., login() returns the DashboardPage). This keeps UI changes localized and tests thin.',
    },
    {
      difficulty: 'mid',
      q: 'Which is the BEST data-isolation strategy so parallel tests sharing one backend do NOT clobber each other\'s records?',
      options: [
        'A single shared, read-only fixture for all tests',
        'Unique per-run data (timestamped/randomized) created and cleaned up in teardown',
        'Running tests serially on the CI master node only',
        'Testing against production data and restoring nightly',
      ],
      correct: 1,
      explain:
        'Unique, self-created data per run plus teardown cleanup prevents collisions under parallelism. Shared or production data makes tests order-dependent and flaky.',
    },
    {
      difficulty: 'mid',
      q: 'A suite has 1,000 tests taking 2 hours. Which change gives the LARGEST initial wall-clock improvement with the least risk?',
      options: [
        'Rewriting every locator for readability',
        'Parallelizing across workers and sharding across CI machines, then tiering tests by speed/risk',
        'Adding more assertions to every test',
        'Moving all tests to run in a single headed session',
      ],
      correct: 1,
      explain: 'Parallelism + sharding is the highest-leverage lever for raw time. Tiering then cuts the long tail for faster feedback.',
    },
    {
      difficulty: 'mid',
      q: 'Which factor most distinguishes a maintainable framework from a brittle one over time?',
      options: [
        'The number of locators stored in a central file',
        'Separation of concerns with thin tests, small page objects, single-responsibility helpers, and reviewed conventions',
        'Using the newest framework version at all times',
        'Running every test on every platform',
      ],
      correct: 1,
      explain:
        'Readability and maintainability come from clean layering, conventions, code review, and small focused pieces — not raw volume, version recency, or coverage breadth.',
    },
    {
      difficulty: 'senior',
      q: 'How does the Single Responsibility Principle (SRP) apply to test-automation code, and what is the main benefit?',
      options: [
        'Every method must be a single line of code to keep files short',
        'Each class/helper owns one concern (e.g., a locator class, a network layer, a config loader) so a change has one home',
        'All tests must call the same single method at the end',
        'There must be exactly one test per page in the application',
      ],
      correct: 1,
      explain:
        'SRP in frameworks means each layer owns one concern — page objects own UI interactions, helpers own shared behaviors, config owns settings. A change in one area touches exactly one place.',
    },
  ],
  cicd: [
    {
      difficulty: 'junior',
      q: 'In CI/CD, what does the "CI" stand for and what is its main goal?',
      options: [
        'Continuous Integration — automatically building and testing code on every push',
        'Centralized Internet — hosting all apps on one server',
        'Customer Integration — gathering user feedback',
        'Code Inspection — only checking code style',
      ],
      correct: 0,
      explain:
        'CI automates building and testing on every commit so problems are caught early. CD (continuous delivery/deployment) automates releasing the build.',
    },
    {
      difficulty: 'junior',
      q: 'Which tool is commonly used to define and run CI/CD pipelines as code?',
      options: [
        'A text editor',
        'A pipeline configuration file executed by a CI server (e.g., GitHub Actions, Jenkins, GitLab CI)',
        'A web browser extension',
        'A database engine',
      ],
      correct: 1,
      explain:
        'Pipelines are defined as code in YAML/CI config files and executed by CI servers like GitHub Actions, Jenkins, or GitLab CI.',
    },
    {
      difficulty: 'junior',
      q: 'What is the fundamental purpose of running a SMOKE test suite separately from the full regression suite in CI?',
      options: [
        'To test the production database schema',
        'To get fast, high-signal pass/fail feedback on core user journeys before the slow full suite runs',
        'To replace unit tests entirely',
        'To run tests only when no commits are pending',
      ],
      correct: 1,
      explain:
        'A smoke suite covers the critical happy paths quickly and runs as an early gate, giving developers feedback in minutes while the full regression runs in the background.',
    },
    {
      difficulty: 'mid',
      q: 'In a CI pipeline, which is the correct ORDER for maximizing fast feedback while keeping quality gates?',
      options: [
        'Full regression suite → build → deploy to production',
        'Lint + unit on every commit → build & cache → deploy to test env → fast smoke gate → longer regression',
        'Deploy to production → run smoke test → roll back on failure',
        'Run all tests locally on one machine before any pipeline runs',
      ],
      correct: 1,
      explain:
        'Fast unit/lint feedback first, then a smoke gate before higher environments, and the long regression after. This keeps developer loops quick while still gating quality.',
    },
    {
      difficulty: 'mid',
      q: 'To make CI execution deterministically reproducible across developer machines, the BEST approach is:',
      options: [
        'Rely on each developer to install matching browsers manually',
        'Run the suite and browsers/drivers inside pinned Docker images with locked dependencies',
        'Set a global environment variable for the CI URL',
        'Use only headed sessions in CI',
      ],
      correct: 1,
      explain:
        'Containerizing the suite with pinned image tags and locked dependency versions eliminates environment drift ("works on my machine").',
    },
    {
      difficulty: 'mid',
      q: 'Which metric BEST tracks whether a test suite is becoming MORE trustworthy over time?',
      options: [
        'The total number of test cases added each sprint',
        'Suite stability: pass rate and flake rate trended over time',
        'The duration of the longest single test',
        'The number of CI machines configured',
      ],
      correct: 1,
      explain: 'Pass rate and flake rate trended over time reveal whether reliability is improving.',
    },
    {
      difficulty: 'senior',
      q: 'A flaky test is discovered failing-then-passing in CI. What is the CORRECT first response per good practice?',
      options: [
        'Set a retry policy AND quarantine/track the test with trace evidence so the root cause gets fixed, not just masked',
        'Permanently mark the test as skipped to silence it',
        'Increase the browser timeout to 10 minutes globally',
        'Ignore it unless it fails three times in a row',
      ],
      correct: 0,
      explain:
        'Retrying keeps the pipeline moving, but you must also quarantine, track, and fix root cause — otherwise flakiness erodes trust in the suite.',
    },
  ],
};
