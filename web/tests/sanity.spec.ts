import { BrowserContext, Page, test } from '@playwright/test';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import users from '../test-data/users.json';
import { attachScreenshotOnFailure, createContext } from '../utils/hooks';
import { msg } from '../utils/messages';

const { valid } = users;

test.describe('Sanity', () => {
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

  test('Sanity - login, inventory and logout flow (TC_WEB_LOGIN_001, 003, 018) @sanity', async () => {
    await loginPage.verifyPageVisible();
    await loginPage.verifyPasswordMasked();

    await loginPage.login(valid.username, valid.password);
    await inventoryPage.verifyPageVisible();

    await inventoryPage.logout();
    await loginPage.verifyLoggedOut();
  });

  test('Sanity - invalid login shows an error (TC_WEB_LOGIN_008) @sanity', async () => {
    await loginPage.login('invalid_user', valid.password);
    await loginPage.verifyErrorMessage(msg.mismatch);
  });

  test('Sanity - empty login shows a required error (TC_WEB_LOGIN_005) @sanity', async () => {
    await loginPage.login('', '');
    await loginPage.verifyErrorMessage(msg.usernameRequired);
  });

  test('Sanity - inventory is blocked without login (TC_WEB_LOGIN_020) @sanity', async () => {
    await loginPage.navigateTo('/inventory.html');
    await loginPage.verifyErrorMessage(msg.protectedRoute('/inventory.html'));
  });

  test('Sanity - logout blocks the Back button (TC_WEB_LOGIN_019) @sanity', async () => {
    await loginPage.login(valid.username, valid.password);
    await inventoryPage.verifyPageVisible();
    await inventoryPage.logout();
    await loginPage.verifyLoggedOut();

    await page.goBack();
    await loginPage.verifyErrorMessage(msg.protectedRoute('/inventory.html'));
  });
});
