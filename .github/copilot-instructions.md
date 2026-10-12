# SnapWork – QA Automation Assignment (US_LOGIN_001)

## Repository layout
- `web/` – Playwright + TypeScript, POM, SauceDemo (https://www.saucedemo.com/)
- `mobile/` – WebdriverIO + Appium (UiAutomator2) + TypeScript, POM, Sauce Labs My Demo App Android
- `test-cases/` – Excel test case workbook + generator script
- `jenkins/` – `Jenkinsfile.web`, `Jenkinsfile.mobile`
- `docs/` – framework documentation, AC deviation log, evidence screenshots

## Conventions
- TypeScript strict mode; async/await only; no `any`.
- Page Objects expose intent-level methods (`login(user, pass)`), never raw locators to specs.
- Assertions live in specs, not page objects (except `isLoaded()` style checks).
- No hard waits (`waitForTimeout`, `browser.pause`). Use web-first assertions / `waitForDisplayed`.
- Test data in `test-data/*.json`; config via `.env` (commit `.env.example` only). Never commit real secrets, device IDs, or absolute machine paths.
- Test IDs in titles must match the Excel: `TC_WEB_LOGIN_001`, `TC_MOB_LOGIN_001`. Tag with `@smoke`, `@regression`, `@negative`, `@security`.
- Failures must capture a screenshot and attach it to the report.

## MCP servers (`.vscode/mcp.json`)
- `playwright` – live exploration of SauceDemo and locator verification.
- `appium` – live inspection of the Android app, locator discovery, session control.
- `jenkins` – trigger/inspect local Jenkins jobs (requires Jenkins MCP Server plugin).
- `github` – repo, branches, PRs.
