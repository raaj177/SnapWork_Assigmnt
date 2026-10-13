# Framework Details - Index

Documentation for Task 5 of the assignment (Automation Framework Documentation) covering the Web and Mobile automation projects for user story `US_LOGIN_001` (Login / Logout).

| Document | Contents |
|---|---|
| [web_framework.md](web_framework.md) | Part A framework details for the Web project (Playwright + TypeScript) and Part B run steps |
| [mobile_framework.md](mobile_framework.md) | Part A framework details for the Mobile project (WebdriverIO + Appium + TypeScript) and Part B run steps |
| [jenkins_setup.md](jenkins_setup.md) | Local Jenkins setup, job configuration, execution and evidence steps (Task 4) |

Related documents:

| Document | Purpose |
|---|---|
| [../QA_AUTOMATION_PROJECT_ARCHITECTURE_AND_KT.md](../QA_AUTOMATION_PROJECT_ARCHITECTURE_AND_KT.md) | Manager-level architecture and knowledge-transfer document |
| [../ac-deviations.md](../ac-deviations.md) | Acceptance criteria versus actual application behavior (Web and Mobile) |

## Applications under test

| Platform | Application | Runner |
|---|---|---|
| Web | SauceDemo, https://www.saucedemo.com/ | Playwright Test |
| Mobile | Sauce Labs My Demo App (native Android) | WebdriverIO + Mocha + Appium (UiAutomator2) |

## Where each Task 5 item is documented

| Task 5 A item | Web | Mobile |
|---|---|---|
| Automation tool / framework | [web A1](web_framework.md#a1-automation-tool-and-framework) | [mobile A1](mobile_framework.md#a1-automation-tool-and-framework) |
| Programming language and version | [web A2](web_framework.md#a2-programming-language-and-versions) | [mobile A2](mobile_framework.md#a2-programming-language-and-versions) |
| Test execution framework | [web A3](web_framework.md#a3-test-execution-framework) | [mobile A3](mobile_framework.md#a3-test-execution-framework) |
| Architecture / design pattern | [web A4](web_framework.md#a4-framework-architecture-and-design-pattern) | [mobile A4](mobile_framework.md#a4-framework-architecture-and-design-pattern) |
| Project folder structure | [web A5](web_framework.md#a5-project-folder-structure) | [mobile A5](mobile_framework.md#a5-project-folder-structure) |
| Purpose of folders and classes | [web A6](web_framework.md#a6-purpose-of-important-folders-and-classes) | [mobile A6](mobile_framework.md#a6-purpose-of-important-folders-and-classes) |
| Test data management | [web A7](web_framework.md#a7-test-data-management) | [mobile A7](mobile_framework.md#a7-test-data-management) |
| Reporting framework | [web A8](web_framework.md#a8-reporting-framework) | [mobile A8](mobile_framework.md#a8-reporting-framework) |
| Reusable utilities and configuration | [web A9](web_framework.md#a9-reusable-utilities-and-configuration-management) | [mobile A9](mobile_framework.md#a9-reusable-utilities-and-configuration-management) |
| Driver initialization and teardown | [web A10](web_framework.md#a10-browser-initialization-and-teardown) | [mobile A10](mobile_framework.md#a10-driver-initialization-and-teardown) |
| Task 5 B (steps to run) | [web Part B](web_framework.md#part-b-steps-to-run-the-web-project) | [mobile Part B](mobile_framework.md#part-b-steps-to-run-the-mobile-project) |

## Repository layout (summary)

```
SnapWork/
  package.json, playwright.config.ts, tsconfig.json, .env.example   # Web project configuration (repository root)
  web/                  # Web automation source
  mobile/               # Mobile automation project (own package.json, tsconfig.json, wdio.conf.ts)
  test-cases/           # Test-case JSON and Excel generator
  jenkins/              # Jenkinsfile.web, Jenkinsfile.mobile
  docs/                 # This documentation, AC deviation log, evidence
  .github/              # Copilot instructions and custom agents
```

## Quick start

```bash
# Web
npm install
npx playwright install chromium
npm run test:web:sanity

# Mobile (phone connected by USB, USB debugging on)
cd mobile
cp .env.example .env        # then edit ANDROID_HOME and ANDROID_UDID
npm install
npm run setup
npm run test:one -- TC_MOB_LOGIN_003

# Both platforms
cd ..
npm run test:all
npm run report:all
```

## Status notes

- Verified from the repository: all file paths, scripts and tool versions in these documents.
- The Web suite has run successfully in Jenkins (sanity set) and locally.
- The Mobile suite has been run on a physical Android phone; the pass status of the complete mobile suite and the mobile Jenkins job should be confirmed before submission (marked "Needs confirmation" where relevant).
- Android emulator execution is described as an option but was not tested in this project.
