import { expect, Locator, Page } from '@playwright/test';
import { describeError } from '../utils/logger';
import { BasePage } from './BasePage';

const PRODUCT_COUNT = 6;

export class InventoryPage extends BasePage {
  readonly menuButton: Locator;
  readonly logoutButton: Locator;
  readonly sortDropdown: Locator;
  readonly addToCartButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.sortDropdown = page.getByRole('combobox', { name: 'Sort products' });
    this.addToCartButtons = page.getByRole('button', { name: 'Add to cart' });
  }

  async isLoaded(): Promise<boolean> {
    this.logger.debug('Checking that the inventory page is loaded');
    try {
      await this.sortDropdown.waitFor({ state: 'visible' });
      this.logger.debug('Inventory page is loaded');
      return true;
    } catch (error) {
      this.logger.error(`Inventory page is not loaded: ${describeError(error)}`);
      return false;
    }
  }

  async getProductCount(): Promise<number> {
    this.logger.debug('Counting products');
    try {
      const count = await this.addToCartButtons.count();
      this.logger.debug(`Product count: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to count products: ${describeError(error)}`);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.logger.info('Logging out');
    try {
      await this.menuButton.click();
      await this.logoutButton.click();
      this.logger.info('Logout clicked');
    } catch (error) {
      this.logger.error(`Logout failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyPageVisible(): Promise<void> {
    this.logger.info('Verifying the inventory page');
    try {
      await expect(this.page).toHaveURL(/\/inventory\.html$/);
      await expect(this.sortDropdown).toBeVisible();
      await expect(this.addToCartButtons).toHaveCount(PRODUCT_COUNT);
      this.logger.info('Inventory page verified');
    } catch (error) {
      this.logger.error(`Inventory page verification failed: ${describeError(error)}`);
      throw error;
    }
  }
}
