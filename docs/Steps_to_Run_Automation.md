# Steps to Run the Automation Project

Task 5, Part B: step-by-step instructions so another QA engineer can clone and run both automation projects independently.

| Project | Application | Tool | Location |
|---|---|---|---|
| Web | SauceDemo (https://www.saucedemo.com/) | Playwright + TypeScript | repository root + `web/` |
| Mobile | Sauce Labs My Demo App (Android) | WebdriverIO + Appium + TypeScript | `mobile/` |

Commands below are for macOS or Linux (zsh or bash). On Windows use Git Bash or WSL for the commands that use `HEADLESS=false` or `cp`.

Related documents: [framework_Details/web_framework.md](framework_Details/web_framework.md), [framework_Details/mobile_framework.md](framework_Details/mobile_framework.md), [framework_Details/jenkins_setup.md](framework_Details/jenkins_setup.md), [QA_AUTOMATION_PROJECT_ARCHITECTURE_AND_KT.md](QA_AUTOMATION_PROJECT_ARCHITECTURE_AND_KT.md).

---

## 1. Prerequisites and software installation

| Software | Needed for | Check command | Install (macOS with Homebrew) |
|---|---|---|---|
| Git | Clone the repository | `git --version` | `brew install git` |
| Node.js 22.x and npm | Both projects | `node -v` and `npm -v` | `brew install node@22` or use `nvm install 22` |
| Java (JDK) | Building Allure reports | `java -version` | `brew install openjdk` |
| Android platform-tools (`adb`) | Mobile only | `adb version` | `brew install --cask android-platform-tools` |
| Android phone (or emulator) | Mobile only | `adb devices` | See step 6 |
| Jenkins LTS | CI only | open http://localhost:8080 | `brew install jenkins-lts` |

Notes:
- The project was developed with Node 22.x. Playwright 1.64.0, TypeScript 5.9.3, WebdriverIO 9.32.0, Appium 3.8.0 and the UiAutomator2 driver 8.7.0 are installed automatically by `npm install`.
- Find the platform-tools folder after installing (you need it in step 4): `dirname $(dirname $(readlink -f $(which adb)))` or look under `/opt/homebrew/Caskroom/android-platform-tools/<version>`. The folder you want contains `platform-tools/adb`.

---

## 2. Clone the repository

```bash
git clone https://github.com/raaj177/SnapWork_Assigmnt.git
cd SnapWork_Assigmnt
```

Use your own repository URL if the project was published elsewhere.

---

## 3. Dependency installation

The repository has two separate Node packages. Install both.

```bash
# Web project (repository root)
npm install

# Mobile project
cd mobile
npm install
cd ..
```

Optional, only to regenerate the Excel test-case workbook:
```bash
cd test-cases
npm install
cd ..
```

Check the install worked:
```bash
npx playwright --version            # prints 1.64.0 or similar
ls mobile/node_modules/.bin | grep wdio     # prints wdio
```

---

## 4. Environment configuration

Real `.env` files are git-ignored; only the `.env.example` templates are committed.

### Web (repository root)
```bash
cp .env.example .env
```
`.env` values (defaults shown; the file is optional because the defaults work):
```
BASE_URL=https://www.saucedemo.com
HEADLESS=true
LOG_LEVEL=info          # debug | info | warn | error
```

### Mobile
```bash
cp mobile/.env.example mobile/.env
```
Edit `mobile/.env`:
```
ANDROID_HOME=<folder that contains platform-tools/adb>
ANDROID_SDK_ROOT=<same folder>
ANDROID_UDID=<serial shown by adb devices, no spaces>
DEVICE_NAME=Android Device
APP_PACKAGE=com.saucelabs.mydemoapp.android
APP_ACTIVITY=com.saucelabs.mydemoapp.android.view.activities.SplashActivity
APP_PATH=               # optional: path to the APK to install before the run
APPIUM_PORT=4723
LOG_LEVEL=info
```
Test users are stored in `web/test-data/users.json` and `mobile/test-data/users.ts` (public demo accounts from the assignment); no secrets need to be configured.

---

## 5. Browser setup for Web automation

```bash
npx playwright install chromium
```
Optional, only for the tests tagged `@cross-browser`:
```bash
npx playwright install firefox webkit
```
Run in a visible browser instead of headless:
```bash
HEADLESS=false npm run test:web:sanity
# or
npm run test:web:headed
```

---

## 6. Android emulator / device setup for Mobile automation

### Physical device (verified in this project)
1. On the phone, open Settings > About phone and tap Build number seven times to enable Developer options.
2. In Developer options, turn on **USB debugging**. If available, also turn on "Install via USB".
3. Connect the phone with a USB cable and accept the "Allow USB debugging" prompt.
4. Check the connection:
   ```bash
   adb devices
   ```
   Expected output: one line like `9cc39942   device` (your serial will differ). Copy that serial into `ANDROID_UDID` in `mobile/.env`.
5. Install **My Demo App** from https://github.com/saucelabs/my-demo-app-android/releases (the release APK), or set `APP_PATH` to the APK path so it is installed at the start of the run.
6. Unlock the phone and keep the screen on during the run.

If `adb devices` shows a name containing a space, such as `adb-...(2)._adb-tls-connect._tcp`, Appium cannot use it. Use a USB cable, or run `adb disconnect` then `adb connect <ip>:<port>` and use the new name. The framework checks this before starting and prints this advice.

### Android emulator (not tested in this project)
1. Create and start an Android Virtual Device in Android Studio (Device Manager).
2. Run `adb devices` and copy the emulator serial (for example `emulator-5554`) into `ANDROID_UDID`.
3. Install the My Demo App APK in the emulator, or set `APP_PATH`.

---

## 7. Appium server setup

Appium 3 is installed by `npm install` and is started and stopped automatically by the test runner (WebdriverIO Appium service, port `APPIUM_PORT`, default 4723). Only the driver needs a one-time install:

```bash
cd mobile
npm run setup                          # runs: appium driver install uiautomator2
npx appium driver list --installed     # optional check: uiautomator2 should be listed
```
Optional manual start for debugging: `npx appium` inside `mobile/`.

---

## 8. Commands to execute individual test cases

Test titles start with the test-case ID from the Excel workbook (`TC_WEB_LOGIN_001`, `TC_MOB_LOGIN_001`, ...).

### Web (from the repository root)

| Goal | Command |
|---|---|
| One test case | `npm run test:web:one -- TC_WEB_LOGIN_001` |
| One spec file | `npx playwright test web/tests/login.spec.ts` |
| One file, visible browser | `npx playwright test web/tests/login.spec.ts --headed` |
| Debug one test | `npm run test:web:one -- TC_WEB_LOGIN_001 --debug` |
| Sanity set | `npm run test:web:sanity` |
| Smoke set | `npm run test:web:smoke` |
| Regression set | `npm run test:web:regression` |
| Cross-browser set | `npm run test:web:cross-browser` |

### Mobile

| Goal | Command (from the repository root) |
|---|---|
| One test case | `npm --prefix mobile run test:one -- TC_MOB_LOGIN_003` |
| Smoke set | `npm run test:mobile:smoke` |
| Regression set | `npm --prefix mobile run test:regression` |

The same commands work inside `mobile/` as `npm run test:one -- TC_MOB_LOGIN_003`, `npm run test:smoke`, `npm run test:regression`.

Tags are words inside the test title and are matched with `--grep`: `@smoke`, `@sanity` (web only), `@regression`, `@negative`, `@security`, `@known-issue`, `@cross-browser` (web only).

---

## 9. Commands to execute the complete test suite

| Goal | Command (repository root) |
|---|---|
| All web tests | `npm run test:web` |
| All mobile tests | `npm run test:mobile` |
| Web, then mobile (both run even if one fails; non-zero exit code if either fails) | `npm run test:all` |
| Smoke tests on both | `npm run test:all:smoke` |
| Both, web in a visible browser | `HEADLESS=false npm run test:all` |
| Type-check web | `npm run typecheck` |
| Type-check mobile | `npm --prefix mobile run typecheck` |

Mobile always runs on the real device, so there is no headless mode for it.

---

## 10. Steps to generate and view reports

Run the tests first; reports are built from their result folders.

| Report | Command (repository root) | Output |
|---|---|---|
| Web Playwright HTML report | `npm run report:web` | `playwright-report/index.html`, opens in the browser |
| Web Allure report | `npm run allure:generate` then `npm run allure:open` | `allure-report/` |
| Mobile Allure report | `npm run report:mobile` | `mobile/allure-report/` |
| Combined web + mobile Allure report | `npm run report:all` | `allure-report-all/` |
| JUnit XML (web) | no command, file is written during the run | `test-results/junit.xml` |
| JUnit XML (mobile) | no command | `mobile/reports/junit/*.xml` |
| Mobile failure screenshots | no command | `mobile/screenshots/` |

Notes:
- Allure needs Java (`java -version`).
- Failed web tests have a screenshot attached in the Playwright and Allure reports. Failed mobile tests also save a screenshot and attach it to Allure.
- To start a clean combined report, delete old results first: `rm -rf allure-results mobile/allure-results`.
- Console output of every step is printed by the framework logger; set `LOG_LEVEL=debug` in `.env` for more detail.

### Regenerate the test-case workbook (optional)
```bash
cd test-cases
npm install
npm run generate
```
Output: `test-cases/US_LOGIN_001_TestCases.xlsx` (Web, Mobile, Summary and AC Traceability sheets).

---

## 11. Jenkins local setup and execution instructions

Full details: [framework_Details/jenkins_setup.md](framework_Details/jenkins_setup.md). Short version:

1. Install and start Jenkins:
   ```bash
   brew install jenkins-lts
   brew services start jenkins-lts
   ```
   Open http://localhost:8080 and unlock it with `cat ~/.jenkins/secrets/initialAdminPassword`. Install the suggested plugins and create an admin user.
2. Install the plugins **NodeJS** and **HTML Publisher** (Manage Jenkins > Plugins), then restart Jenkins.
3. Add a Node tool: Manage Jenkins > Tools > NodeJS installations. Name it exactly `NodeJS-22`, choose a 22.x version, leave "Global npm packages" empty.
4. Allow HTML reports: Manage Jenkins > Script Console, run:
   ```groovy
   System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "")
   ```
5. Make sure the code is on GitHub (Jenkins checks it out), including the `jenkins/` folder.
6. Create two Pipeline jobs (Dashboard > New Item > Pipeline), each with **Definition** = `Pipeline script from SCM`, **SCM** = `Git`, your repository URL, **Branch** = `*/main`:

   | Job name | Script Path |
   |---|---|
   | `SnapWork-Web-Tests` | `jenkins/Jenkinsfile.web` |
   | `SnapWork-Mobile-Tests` | `jenkins/Jenkinsfile.mobile` |

7. Run each job with **Build Now** once (this makes the parameter form appear; the first mobile build fails at "Device check" because its parameters are empty), then use **Build with Parameters**:

   | Job | Parameters |
   |---|---|
   | Web | `TEST_SUITE` = `sanity`, `smoke`, `regression` or `all`; optional `TEST_ID`, `HEADLESS`, `ALL_BROWSERS` |
   | Mobile | `ANDROID_HOME`, `ANDROID_UDID`, `TEST_SUITE` = `smoke`, `regression` or `all`; optional `TEST_ID` |

8. Open the build number > **Console Output** and look for `Finished: SUCCESS`.
9. View the reports on the job page: Latest Test Result, Playwright Report, Web Allure Report, Mobile Allure Report.

The mobile job must run on the machine that has the phone attached by USB (the Jenkins process cannot reach the phone from Docker).

---

## Quick verification (to confirm your setup works)

1. `npm run test:web:sanity` finishes with all tests passed.
2. `adb devices` shows your device, then `npm run test:mobile:smoke` runs on the phone.
3. `npm run report:all` opens a report that lists both web and mobile tests.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `wdio: command not found` | Mobile dependencies not installed | `cd mobile && npm install` |
| `ERESOLVE` error during `npm install` in `mobile/` | Package version mismatch | Use the repository's `mobile/package.json` (it pins compatible versions) |
| `uiautomator2 cannot be installed ... server version` | Driver needs Appium 3 | Run `npm install` in `mobile/` so Appium 3 is installed, then `npm run setup` |
| `Device ... was not in the list of connected devices` | Device name with a space, or phone disconnected | `adb devices`; use USB or `adb connect <ip>:<port>` |
| `No Android device is connected` | Cable, USB debugging, or authorization | Reconnect and accept the debugging prompt |
| Playwright says the browser executable does not exist | Browsers not installed | `npx playwright install chromium` |
| Report is empty or `allure-results does not exist` | Tests not run yet | Run the tests, then open the report |
| `allure` fails with a Java error | Java not installed | Install Java and check `java -version` |
| Jenkins: `Unable to find Jenkinsfile.web` | Script Path missing the folder | Use `jenkins/Jenkinsfile.web` |
| Jenkins: `Couldn't find any revision to build` | Wrong branch name | Use `*/main` (check with `git ls-remote --heads origin`) |
