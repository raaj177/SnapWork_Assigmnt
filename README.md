# SnapWork - Web and Mobile Login Automation (US_LOGIN_001)

QA Manager technical assignment: test-case design, Web and Mobile automation frameworks, Jenkins CI/CD (local) and documentation for the Login / Logout feature.

| Platform | Application under test | Tooling |
|---|---|---|
| Web | SauceDemo, https://www.saucedemo.com/ | Playwright + TypeScript, Page Object Model |
| Mobile | Sauce Labs My Demo App (Android), https://github.com/saucelabs/my-demo-app-android | WebdriverIO + Appium (UiAutomator2) + TypeScript, Page Object Model |
| CI | Local Jenkins | `jenkins/Jenkinsfile.web`, `jenkins/Jenkinsfile.mobile` |

## Deliverables

| Deliverable | Location |
|---|---|
| Test cases (Manual / Automation / Both) | `test-cases/US_LOGIN_001_TestCases.xlsx` (generated from `test-cases/test-cases.json`) |
| Web automation source | `web/`, `playwright.config.ts`, `package.json` |
| Mobile automation source | `mobile/` |
| Framework documentation | [docs/framework_Details/](docs/framework_Details/README.md) |
| Steps to run the automation | [docs/Steps_to_Run_Automation.md](docs/Steps_to_Run_Automation.md) |
| Jenkins integration | `jenkins/` and [docs/framework_Details/jenkins_setup.md](docs/framework_Details/jenkins_setup.md) |
| Architecture and knowledge transfer | [docs/QA_AUTOMATION_PROJECT_ARCHITECTURE_AND_KT.md](docs/QA_AUTOMATION_PROJECT_ARCHITECTURE_AND_KT.md) |
| Acceptance criteria vs actual behavior | [docs/ac-deviations.md](docs/ac-deviations.md) |
| Execution reports and evidence | `docs/evidence/` (see "Reports") |

## Test cases

66 cases in total: 38 Web and 28 Mobile. Execution types: Manual 18, Automation 34, Both 14.
Every Automation or Both case has an automated test whose title starts with the same ID (`TC_WEB_LOGIN_nnn`, `TC_MOB_LOGIN_nnn`).

Regenerate the workbook after editing `test-cases/test-cases.json`:
```bash
cd test-cases
npm install
npm run generate
```

## Repository layout

```
package.json, playwright.config.ts, tsconfig.json, .env.example   # Web project configuration
web/                 config, pages, tests, test-data, utils        # Playwright framework
mobile/              own package: wdio.conf.ts, pages, tests, utils # WebdriverIO + Appium framework
test-cases/          test-cases.json and the Excel generator
jenkins/             Jenkinsfile.web, Jenkinsfile.mobile
docs/                documentation and evidence
.github/             Copilot instructions and custom agents
```

## Prerequisites

Git, Node.js 22.x with npm, Java (for Allure reports), Android platform-tools (`adb`), and an Android phone with USB debugging for the mobile suite. Jenkins is needed only for CI. Full details: [docs/Steps_to_Run_Automation.md](docs/Steps_to_Run_Automation.md).

## Setup

```bash
git clone https://github.com/raaj177/SnapWork_Assigmnt.git
cd SnapWork_Assigmnt

# Web
npm install
npx playwright install chromium
cp .env.example .env                      # optional; defaults work

# Mobile
cd mobile
npm install
npm run setup                             # installs the Appium UiAutomator2 driver
cp .env.example .env                      # set ANDROID_HOME and ANDROID_UDID (output of `adb devices`)
cd ..
```
The phone must be connected by USB, unlocked, with My Demo App installed. If `adb devices` shows a name with a space, use USB or `adb connect <ip>:<port>` (Appium cannot use names with spaces).

## Run

| Goal | Command (repository root) |
|---|---|
| One web test | `npm run test:web:one -- TC_WEB_LOGIN_001` |
| One mobile test | `npm --prefix mobile run test:one -- TC_MOB_LOGIN_003` |
| Web sanity / smoke / regression | `npm run test:web:sanity`, `npm run test:web:smoke`, `npm run test:web:regression` |
| Mobile smoke | `npm run test:mobile:smoke` |
| Full web suite | `npm run test:web` |
| Full mobile suite | `npm run test:mobile` |
| Web then mobile | `npm run test:all` |
| Web in a visible browser | `HEADLESS=false npm run test:web:sanity` or `npm run test:web:headed` |

Tags are words in the test titles and are matched with `--grep`: `@smoke`, `@sanity` (web only), `@regression`, `@negative`, `@security`, `@known-issue`, `@cross-browser` (web only).

## Reports

| Report | Command |
|---|---|
| Web Playwright HTML | `npm run report:web` |
| Web Allure | `npm run allure:generate` then `npm run allure:open` |
| Mobile Allure | `npm run report:mobile` |
| Combined Web + Mobile Allure | `npm run report:all` |

Result files: `test-results/junit.xml` (web), `mobile/reports/junit/*.xml` (mobile), `mobile/screenshots/` (mobile failures). Failed web tests have a screenshot attached in the reports. Generated report folders are git-ignored; reviewed copies and screenshots of the reports belong in `docs/evidence/`.

## Jenkins (local)

Two Pipeline jobs read the Jenkinsfiles from this repository:

| Job | Script Path |
|---|---|
| `SnapWork-Web-Tests` | `jenkins/Jenkinsfile.web` |
| `SnapWork-Mobile-Tests` | `jenkins/Jenkinsfile.mobile` |

Required: NodeJS and HTML Publisher plugins, a Node tool named `NodeJS-22`, and (for the mobile job) the Jenkins agent running on the machine that has the phone attached. Setup, parameters and evidence steps: [docs/framework_Details/jenkins_setup.md](docs/framework_Details/jenkins_setup.md).

## Known application behavior (documented, not framework defects)

The web application matches the acceptance criteria except for a hand-made session cookie being accepted. The mobile application accepts any non-empty credentials and opens on the products screen without login. Tests that assert the correct behavior are tagged `@known-issue` and are written to pass while the defect exists and fail once the application is fixed. Details: [docs/ac-deviations.md](docs/ac-deviations.md).

## AI tools used

- GitHub Copilot in VS Code (chat and agent mode) with a Claude model, used for test-case design, framework code, Jenkinsfiles and documentation. The generated code and documents were reviewed and executed by the author.
- Custom Copilot agents in `.github/agents/` (orchestrator, requirements analyst, test designer, web and mobile automation engineers, CI/CD engineer, reviewer, docs writer).
- MCP servers used for exploration and locator verification: Playwright MCP (SauceDemo) and Appium MCP (My Demo App). A template is in `.vscode/mcp.example.json`.

## Security notes

No real secrets are stored. The test users are the public demo accounts supplied by the assignment and live in the test-data files. `.env` files, device identifiers, APKs and `.vscode/mcp.json` are git-ignored.
