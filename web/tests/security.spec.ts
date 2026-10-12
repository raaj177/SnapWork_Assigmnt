import { BrowserContext, Dialog, expect, Page, test } from '@playwright/test';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import cases from '../test-data/login-cases.json';
import users from '../test-data/users.json';
import { attachScreenshotOnFailure, createContext } from '../utils/hooks';
import { msg } from '../utils/messages';
import { allCookieValues, getSessionCookie, setSessionCookie } from '../utils/session';

const { valid } = users;

test.describe('Security', () => {
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

  test.afterEach(async (_fixtures, testInfo) => {
    await attachScreenshotOnFailure(page, testInfo);
  });

  test('TC_WEB_LOGIN_019 @security @regression Back after logout does not reveal inventory', async () => {
    await loginPage.login(valid.username, valid.password);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await inventoryPage.logout();
    await expect(page).toHaveURL(/\/$/);

    await page.goBack();

    await expect.poll(() => loginPage.getErrorText()).toBe(msg.protectedRoute('/inventory.html'));
    expect(await inventoryPage.getProductCount()).toBe(0);
  });

  test('TC_WEB_LOGIN_020 @smoke @sanity @security @regression inventory URL is blocked without login', async () => {
    await loginPage.navigateTo('/inventory.html');
    await expect.poll(() => loginPage.getErrorText()).toBe(msg.protectedRoute('/inventory.html'));
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('TC_WEB_LOGIN_021 @security @regression cart URL is blocked without login', async () => {
    await loginPage.navigateTo('/cart.html');
    await expect.poll(() => loginPage.getErrorText()).toBe(msg.protectedRoute('/cart.html'));
    await expect(page).not.toHaveURL(/cart/);
  });

  test('TC_WEB_LOGIN_023 @security @regression logout removes the session cookie', async () => {
    await loginPage.login(valid.username, valid.password);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    expect(await getSessionCookie(context)).toBe(valid.username);

    await inventoryPage.logout();

    await expect(page).toHaveURL(/\/$/);
    expect(await getSessionCookie(context)).toBeUndefined();
  });

  test('TC_WEB_LOGIN_024 @security @negative @regression SQL injection does not bypass login', async () => {
    await loginPage.login(cases.payloads.sql, cases.payloads.sql);
    await expect.poll(() => loginPage.getErrorText()).toBe(msg.mismatch);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('TC_WEB_LOGIN_025 @security @negative @regression script payload is neither executed nor rendered', async () => {
    let dialogOpened = false;
    const onDialog = async (dialog: Dialog): Promise<void> => {
      dialogOpened = true;
      await dialog.dismiss();
    };
    page.on('dialog', onDialog);

    try {
      await loginPage.login(cases.payloads.xss, 'x');
      await expect.poll(() => loginPage.getErrorText()).toBe(msg.mismatch);
      expect(dialogOpened).toBe(false);
      expect(await page.content()).not.toContain(cases.payloads.xss);
    } finally {
      page.off('dialog', onDialog);
    }
  });

  test('TC_WEB_LOGIN_026 @security @regression password is not exposed in URL, cookies or local storage', async () => {
    await loginPage.login(valid.username, valid.password);
    await expect(page).toHaveURL(/\/inventory\.html$/);

    expect(page.url()).not.toContain(valid.password);
    for (const value of await allCookieValues(context)) {
      expect(value).not.toContain(valid.password);
    }
    const storage = await page.evaluate(() => JSON.stringify(window.localStorage));
    expect(storage).not.toContain(valid.password);
  });

  test('TC_WEB_LOGIN_027 @security @known-issue forged session cookie must not grant access', async () => {
    test.fail(true, 'D-W2: the app accepts a hand-made session-username cookie');

    await setSessionCookie(context, valid.username);
    await loginPage.navigateTo('/inventory.html');

    await expect(page).not.toHaveURL(/inventory/);
  });

  test('TC_WEB_LOGIN_028 @security @regression error does not reveal which field was wrong', async () => {
    await loginPage.login('invalid_user', valid.password);
    await expect.poll(() => loginPage.getErrorText()).toBe(msg.mismatch);
    const wrongUserError = await loginPage.getErrorText();

    await loginPage.open();
    await loginPage.login(valid.username, 'wrong_password');
    await expect.poll(() => loginPage.getErrorText()).toBe(msg.mismatch);

    expect(await loginPage.getErrorText()).toBe(wrongUserError);
  });
});
