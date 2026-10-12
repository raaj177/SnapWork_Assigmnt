# US_LOGIN_001 – Acceptance Criteria vs Actual Behavior

Verification method: **Web** = live exploration with Playwright MCP on 2026-10-12. **Mobile** = live exploration with Appium MCP (UiAutomator2) on a physical Android device on 2026-10-12, cross-checked with the app source (release 2.3.0, `mda-2.3.0-27.apk`).

## A. Web – SauceDemo (https://www.saucedemo.com/)

| AC | Expected | Actual (verified live) | Status |
|---|---|---|---|
| 1 | Username, Password, Login controls | `username` (placeholder "Username"), `password` (placeholder "Password"), `login-button` (value "Login") all present | Match |
| 2 | Can enter valid credentials | `standard_user` / `secret_sauce` accepted by inputs; Enter key also submits | Match |
| 3 | Password masked | Password input has `type="password"` | Match |
| 4 | Valid login succeeds | Redirects to `/inventory.html`, title "Products", 6 items | Match |
| 5 | Invalid credentials show error | "Epic sadface: Username and password do not match any user in this service" for invalid user, valid user + wrong password, wrong case (`STANDARD_USER`), leading/trailing spaces, SQLi and XSS strings. `locked_out_user`: "Epic sadface: Sorry, this user has been locked out." | Match |
| 6 | Mandatory field validation | Both empty: "Username is required". Username only: "Password is required". Password only: "Username is required". Fields get `input_error` class; error is dismissible via `error-button` | Match |
| 7 | Navigates to authenticated screen | `/inventory.html`; stays logged in after reload (cookie `session-username`) | Match |
| 8 | No access without login | `/inventory.html` and `/cart.html` redirect to `/` with "Epic sadface: You can only access '/inventory.html' when you are logged in." | Match (see D-W2) |
| 9 | Logout | Menu button `react-burger-menu-btn` > `logout-sidebar-link` returns to `/`; cookie removed; fields cleared; back button and direct URL both blocked with the login-required error | Match |

### Web observations and deviations

| ID | Finding | Severity | Notes |
|---|---|---|---|
| D-W1 | Valid usernames and the shared password are printed on the login page | Low | By design for a demo; a security finding on a real app |
| D-W2 | Session is the client-readable, unsigned cookie `session-username` (not HttpOnly, not Secure). Setting it manually to `standard_user` grants access to `/inventory.html`; an unknown value is rejected | Medium | Cookie forgery works for valid usernames; cover in security test |
| D-W3 | Password-only submit reports "Username is required" (username checked first); the password error is only shown when username is filled | Info | Document as expected behavior |
| D-W4 | The menu now includes "Dynamic Catalog" in addition to All Items, About, Logout, Reset App State | Info | Not part of login scope |
| D-W5 | Error messages are identical for wrong user and wrong password | Positive | No username enumeration |
| D-W6 | Chrome shows "Change your password" (Google Password Manager breach warning) after login with `secret_sauce` | Info | Browser feature, not the app. It can overlay the page in manual runs with a normal Chrome profile. Playwright's fresh browser profile does not show it, so automation is unaffected; mention it in manual-test notes |

### Web locator inventory

| Element | Locator |
|---|---|
| Username | `[data-test="username"]` |
| Password | `[data-test="password"]` |
| Login button | `[data-test="login-button"]` |
| Error banner | `[data-test="error"]` |
| Error dismiss | `[data-test="error-button"]` |
| Menu button | `#react-burger-menu-btn` |
| Logout link | `[data-test="logout-sidebar-link"]` |
| Inventory title | `[data-test="title"]` |
| Inventory items | `[data-test="inventory-item"]` |
| Menu behavior | Slide-in takes about 0.5s; wait for the link to be visible before clicking |

Test users (password `secret_sauce`): `standard_user`, `locked_out_user`, `problem_user`, `performance_glitch_user`, `error_user`, `visual_user`.

Evidence: [web-login-page.png](evidence/web-login-page.png)

## B. Mobile – My Demo App Android (verified live on a physical device)

App: package `com.saucelabs.mydemoapp.android`, launch activity `com.saucelabs.mydemoapp.android.view.activities.SplashActivity`. The installed build version was not read from the device; the source reviewed is release 2.3.0.

Device note: `pm clear` is denied on this phone (`CLEAR_APP_USER_DATA` permission), so a session with `noReset: false` fails. Use `noReset: true`, `appWaitActivity: "*"`, and reset state through the app (logout / Reset App State).

| AC | Expected | Actual (verified live) | Status |
|---|---|---|---|
| 1 | Username, Password, Login controls | `nameET`, `passwordET`, `loginBtn` on the Login screen | Match |
| 2 | Enter valid credentials | Typing works; tapping a listed username (`username1TV`) autofills both fields | Match |
| 3 | Password masked | `passwordET` is `textPassword` | Match |
| 4 | Valid login succeeds | `bod@example.com` / `10203040` logs in | Match |
| 5 | Invalid credentials show error | **No credential check.** `bod@example.com` with password `wrongpass` logged in and opened Products. Only `alice@example.com` is rejected: "Sorry this user has been locked out." (shown in `passwordErrorTV`) | **Deviation** |
| 6 | Mandatory field validation | Both empty: only "Username is required" (`nameErrorTV`); `passwordErrorTV` is not in the hierarchy. Username only: "Enter Password" (not "Password is required"). Whitespace trimming is from source, not run | Partial |
| 7 | Navigate to authenticated screen | Login returns to the Catalog (Products) screen, which was already visible before login | Deviation |
| 8 | No access without login | App opens directly on Products (no login screen, confirmed on launch). Catalog and cart are reachable without login. Only checkout redirects to Login (from source) | **Deviation** |
| 9 | Logout | Menu > `Logout Menu Item` > dialog "Are you sure you want to logout" (CANCEL / LOGOUT) > Login screen with empty fields. No "successfully logged out" message is shown (commented out in source) | Partial |

### Mobile observations

| ID | Finding | Severity |
|---|---|---|
| D-M1 | Credential validation is absent: `bod@example.com` / `10203040` is valid only because every credential is accepted | High (vs AC 5) |
| D-M2 | Login is reached through the drawer menu, not shown at launch | Info |
| D-M3 | Login state lives in memory only; app restart logs the user out | Info |
| D-M4 | Valid and locked-out usernames plus the password are listed on the Login screen | Low |
| D-M5 | Error text differs for password ("Enter Password") versus username ("Username is required") | Low |

### Mobile locator inventory (verified with Appium MCP unless noted)

| Element | Locator |
|---|---|
| Menu button | accessibility id `View menu` |
| Login menu item | accessibility id `Login Menu Item` |
| Logout menu item | accessibility id `Logout Menu Item` |
| Username field | resource-id `com.saucelabs.mydemoapp.android:id/nameET` |
| Password field | resource-id `com.saucelabs.mydemoapp.android:id/passwordET` |
| Login button | accessibility id `Tap to login with given credentials` |
| Username error | resource-id `...:id/nameErrorTV` |
| Password error / locked-out text | resource-id `...:id/passwordErrorTV` (only in hierarchy while visible) |
| Login screen title | resource-id `...:id/loginTV` |
| Products title | resource-id `...:id/productTV` (text "Products") |
| Autofill bod user | resource-id `...:id/username1TV` (from source) |
| Logout dialog | `android:id/message`, `android:id/button1` (LOGOUT), `android:id/button2` (CANCEL); `alertTitle` not found |
| Password masking | `passwordET` attribute `password` = `true` |

Hidden elements are absent from the page source, so negative checks should assert absence, not empty text.

## C. Credential validation summary

| App | Credentials | Result |
|---|---|---|
| Web | `standard_user` / `secret_sauce` | Valid, as stated |
| Mobile | `bod@example.com` / `10203040` | Accepted, but so is `bod@example.com` / `wrongpass` (D-M1) |

## D. Open items
- Read the installed app version name from the device.
- Test Designer should use these results as expected values; mark mobile AC 5 and AC 8 cases as "Deviation" in the Actual Result column.
- Not run live: whitespace-only password, checkout redirect to login, session after app restart.
