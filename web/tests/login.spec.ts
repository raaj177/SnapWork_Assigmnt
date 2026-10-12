import { BrowserContext, expect, Page, test } from '@playwright/test';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import cases from '../test-data/login-cases.json';
import users from '../test-data/users.json';
import { attachScreenshotOnFailure, createContext } from '../utils/hooks';
import { msg } from '../utils/messages';

const { valid, lockedOut, performanceGlitch } = users;
const mandatoryErrors: Record<string, string> = {
  usernameRequired: msg.usernameRequired,
  passwordRequired: msg.passwordRequired,
};

test.describe('Login', () => {
  let context: BrowserContext;
  let page: Page;
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;

  test.beforeAll(async ({ browser }) => {
    context = await createContext(browser);
    page = await context.newPage();
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test.beforeEach(async () => {
    await context.clearCookies();
    await loginPage.open();
  });

  test.afterEach(async ({}, testInfo) => {
    await attachScreenshotOnFailure(page, testInfo);
  });

  test('TC_WEB_LOGIN_001 @smoke @sanity @regression valid credentials open the inventory page', async () => {
    await loginPage.login(valid.username, valid.password);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    expect(await inventoryPage.isLoaded()).toBe(true);
    await expect.poll(() => inventoryPage.getProductCount()).toBe(6);
  });

  test('TC_WEB_LOGIN_002 @smoke @sanity @regression login screen shows username, password and login controls', async () => {
    expect(await loginPage.isLoaded()).toBe(true);
    expect(await loginPage.getPasswordFieldType()).toBe('password');
    expect(await loginPage.isLoginButtonEnabled()).toBe(true);
  });

  test('TC_WEB_LOGIN_003 @smoke @sanity @regression password is masked while typed', async () => {
    await loginPage.enterPassword(valid.password);
    expect(await loginPage.isPasswordMasked()).toBe(true);
    expect(await loginPage.getPasswordValue()).toBe(valid.password);
  });

  test('TC_WEB_LOGIN_004 @regression Enter key submits the login form', async () => {
    await loginPage.loginWithEnterKey(valid.username, valid.password);
    await expect(page).toHaveURL(/\/inventory\.html$/);
  });

  for (const c of cases.mandatory) {
    test(`${c.id} ${c.tags} ${c.title}`, async () => {
      await loginPage.login(c.username, c.password);
      await expect.poll(() => loginPage.getErrorText()).toBe(mandatoryErrors[c.error]);
      await expect(page).not.toHaveURL(/inventory/);
    });
  }

  for (const c of cases.invalid) {
    test(`${c.id} ${c.tags} ${c.title}`, async () => {
      await loginPage.login(c.username, c.password);
      await expect.poll(() => loginPage.getErrorText()).toBe(msg.mismatch);
      await expect(page).not.toHaveURL(/inventory/);
    });
  }

  test('TC_WEB_LOGIN_014 @smoke @sanity @negative @regression locked out user is rejected', async () => {
    await loginPage.login(lockedOut.username, lockedOut.password);
    await expect.poll(() => loginPage.getErrorText()).toBe(msg.lockedOut);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('TC_WEB_LOGIN_015 @regression error banner can be dismissed', async () => {
    await loginPage.login('', '');
    await expect.poll(() => loginPage.isErrorVisible()).toBe(true);
    await loginPage.dismissError();
    await expect.poll(() => loginPage.isErrorVisible()).toBe(false);
  });

  test('TC_WEB_LOGIN_017 @regression inventory page lists six products after login', async () => {
    await loginPage.login(valid.username, valid.password);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    expect(await inventoryPage.isLoaded()).toBe(true);
    await expect.poll(() => inventoryPage.getProductCount()).toBe(6);
  });

  test('TC_WEB_LOGIN_022 @regression session survives a page refresh', async () => {
    await loginPage.login(valid.username, valid.password);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await page.reload();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect.poll(() => inventoryPage.getProductCount()).toBe(6);
  });

  test('TC_WEB_LOGIN_034 @regression @cross-browser valid login works in every browser', async () => {
    await loginPage.login(valid.username, valid.password);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    expect(await inventoryPage.isLoaded()).toBe(true);
  });

  test('TC_WEB_LOGIN_036 @regression performance_glitch_user reaches inventory within 10 seconds', async () => {
    await loginPage.login(performanceGlitch.username, performanceGlitch.password);
    await expect(page).toHaveURL(/\/inventory\.html$/, { timeout: 10_000 });
  });
});
