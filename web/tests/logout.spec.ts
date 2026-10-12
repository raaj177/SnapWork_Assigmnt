import { BrowserContext, expect, Page, test } from '@playwright/test';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import users from '../test-data/users.json';
import { attachScreenshotOnFailure, createContext } from '../utils/hooks';

const { valid } = users;

test.describe('Logout', () => {
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

  test('TC_WEB_LOGIN_018 @smoke @sanity @regression logout returns to a clean login page', async () => {
    await loginPage.login(valid.username, valid.password);
    await expect(page).toHaveURL(/\/inventory\.html$/);

    await inventoryPage.logout();

    await expect(page).toHaveURL(/\/$/);
    expect(await loginPage.isLoaded()).toBe(true);
    expect(await loginPage.getUsernameValue()).toBe('');
    expect(await loginPage.getPasswordValue()).toBe('');
  });
});
