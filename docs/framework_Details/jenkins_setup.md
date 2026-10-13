# Jenkins Setup and Execution (Local)

Covers Task 4 of the assignment: install Jenkins locally, create one job per automation project, execute the suites, publish reports and capture evidence. Pipeline files: `jenkins/Jenkinsfile.web` and `jenkins/Jenkinsfile.mobile`.

Environment used: Jenkins running locally on macOS at http://localhost:8080 (installed with Homebrew), pipelines read from the GitHub repository.

---

## 1. Install and start Jenkins (macOS)

```bash
brew install jenkins-lts
brew services start jenkins-lts
```
Open http://localhost:8080. On first start, read the initial admin password:
```bash
cat ~/.jenkins/secrets/initialAdminPassword
```
Choose "Install suggested plugins" and create the admin user.

## 2. Plugins

Manage Jenkins > Plugins > Available plugins. Install:

| Plugin | Needed for |
|---|---|
| NodeJS | `tools { nodejs 'NodeJS-22' }` in both Jenkinsfiles |
| HTML Publisher | `publishHTML` step for the Playwright and Allure reports |
| Pipeline, Git, JUnit | Included in the suggested set; used by `checkout scm` and the `junit` step |

Restart Jenkins after installing.

## 3. Node tool

Manage Jenkins > Tools > NodeJS installations > Add NodeJS:
- Name: `NodeJS-22` (exact; the Jenkinsfiles refer to this name)
- Version: choose a 22.x release (earlier a 26.x release was selected by mistake)
- Leave **Global npm packages to install** empty (a stray value caused repeated `npm install -g` errors in the build log)

## 4. Allow HTML reports

Jenkins blocks JavaScript in published HTML by default. Manage Jenkins > Script Console, run once:
```groovy
System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "")
```
The setting is cleared when Jenkins restarts; run it again if the report pages are blank.

## 5. Source repository

Jenkins checks the code out from Git, so the Jenkinsfiles must be committed and pushed.

```bash
git init
git branch -M main
git add -A
git commit -m "Initial commit"
git remote add origin https://github.com/raaj177/SnapWork_Assigmnt.git
git push -u origin main
```
Check that `jenkins/Jenkinsfile.web` and `jenkins/Jenkinsfile.mobile` appear on GitHub. Every code change must be pushed before Jenkins can use it.

## 6. Create the Web job

1. Dashboard > **New Item**, name `SnapWork-Web-Tests`, type **Pipeline**.
2. Pipeline section: **Definition** = `Pipeline script from SCM`.
3. **SCM** = `Git`.
4. **Repository URL** = `https://github.com/raaj177/SnapWork_Assigmnt.git` (credentials `- none -` for a public repository).
5. **Branch Specifier** = `*/main`.
6. **Script Path** = `jenkins/Jenkinsfile.web`.
7. Save.

### Web pipeline (`jenkins/Jenkinsfile.web`)

| Stage | Action |
|---|---|
| Checkout | `checkout scm`; removes old result folders |
| Install | `npm ci` |
| Browsers | `npx playwright install chromium` (plus Firefox and WebKit when `ALL_BROWSERS` is ticked) |
| Web tests | Runs by `TEST_ID`, or `TEST_SUITE` (`all`, `sanity`, `smoke`, `regression`); chromium only unless `ALL_BROWSERS` |
| Post | JUnit results, Allure generation, `publishHTML` (Playwright Report, Web Allure Report), archive artifacts |

Parameters: `TEST_SUITE`, `TEST_ID`, `HEADLESS`, `ALL_BROWSERS`. An empty `TEST_SUITE` is treated as `all`.

## 7. Create the Mobile job

Repeat step 6 with:
- Name: `SnapWork-Mobile-Tests`
- Script Path: `jenkins/Jenkinsfile.mobile`

### Mobile pipeline (`jenkins/Jenkinsfile.mobile`)

| Stage | Action |
|---|---|
| Checkout | `checkout scm`; removes old mobile result folders |
| Install | `npm ci` in `mobile/` |
| Appium driver | Installs the UiAutomator2 driver if it is missing |
| Device check | Fails if `ANDROID_HOME` is empty; prints `adb devices` |
| Mobile tests | Runs by `TEST_ID` or `TEST_SUITE` (`all`, `smoke`, `regression`) |
| Post | JUnit results, Allure generation, `publishHTML` (Mobile Allure Report), archive screenshots and reports |

Parameters: `TEST_SUITE`, `TEST_ID`, `ANDROID_HOME`, `ANDROID_UDID`.

Requirements for the mobile job: the Jenkins agent must be the machine that has the phone attached by USB, the phone must be unlocked with USB debugging on, and My Demo App must be installed.

## 8. Run the jobs

1. Open the job and click **Build Now** for the first run. A pipeline defines its parameters in the Jenkinsfile, so **Build with Parameters** appears only after the first run. The first mobile build is expected to fail at "Device check" because the parameters are empty.
2. Click **Build with Parameters** and set values:

| Job | Parameter | Value |
|---|---|---|
| Web | `TEST_SUITE` | `sanity` (or `all`) |
| Mobile | `ANDROID_HOME` | folder that contains `platform-tools/adb` |
| Mobile | `ANDROID_UDID` | serial from `adb devices` |
| Mobile | `TEST_SUITE` | `smoke` (or `all`) |

3. Click **Build**, then open the build number and **Console Output**. A successful run ends with `Finished: SUCCESS`.

## 9. View results and reports

On the job page:
- **Latest Test Result**: JUnit results.
- **Playwright Report**, **Web Allure Report**, **Mobile Allure Report**: published HTML reports.
- Build page > **Artifacts**: `test-results/`, `playwright-report/`, `mobile/screenshots/`, `mobile/reports/`.

Local equivalents: see [web_framework.md](web_framework.md#b7-reports) and [mobile_framework.md](mobile_framework.md#b8-reports).

## 10. Evidence to capture

Save the screenshots in `docs/evidence/`.

| # | Screenshot | File name suggestion |
|---|---|---|
| 1 | Jenkins dashboard showing both jobs | `jenkins-dashboard.png` |
| 2 | Web job configuration (Pipeline section) | `jenkins-web-config.png` |
| 3 | Mobile job configuration (Pipeline section) | `jenkins-mobile-config.png` |
| 4 | Web build console output ending in `SUCCESS` | `jenkins-web-console.png` |
| 5 | Mobile build console output ending in `SUCCESS` | `jenkins-mobile-console.png` |
| 6 | Web job page with test result trend and report links | `jenkins-web-report.png` |
| 7 | Mobile job page with test result trend and report links | `jenkins-mobile-report.png` |

Status of the evidence: the Web job has run successfully in Jenkins (sanity set). The Mobile job's successful run and all screenshots in `docs/evidence/` (only `web-login-page.png` exists at present) still need to be captured.

## 11. Incidents seen during setup and their fixes

| Symptom | Cause | Fix |
|---|---|---|
| `Unable to find Jenkinsfile.web from git ...` | Script Path missing the folder | Use `jenkins/Jenkinsfile.web` |
| `First argument must use the object destructuring pattern: _fixtures` | Hook signature in the web specs | Fixed in the code; push the fix, then rebuild |
| The same failure repeated after the fix | Jenkins read the old commit from GitHub | `git push`, then confirm the build log shows the new commit message |
| Repeated `npm install -g Checked` errors | Stray value in the NodeJS tool's global packages | Clear **Global npm packages to install** |
| `NodeJS-22` downloaded a 26.x Node | Wrong version selected | Choose a 22.x version in the tool |
| `Couldn't find any revision to build` | Branch name mismatch (`master` vs `main`) | Use `*/main`; check with `git ls-remote --heads origin` |
| `git add` fails: `mobile/ does not have a commit checked out` | Nested `.git` folder inside `mobile/` | Remove `mobile/.git` |

## 12. Notes and limitations

- Triggers are manual; no webhook or polling is configured in the Jenkinsfiles.
- The web and mobile jobs are separate; a combined job with one report is not implemented. A combined Allure report is available locally with `npm run report:all`.
- The mobile job depends on a USB-attached phone; Jenkins running inside Docker cannot reach it.
- `npm ci` requires `package-lock.json` files that match `package.json`; commit them (root and `mobile/`).
- `.github/workflows/playwright.yml` is the original Playwright scaffold for GitHub Actions and is not part of the Jenkins design.
