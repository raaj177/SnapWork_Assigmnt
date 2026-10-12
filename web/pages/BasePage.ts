import { Page } from '@playwright/test';
import { describeError, Logger } from '../utils/logger';

export abstract class BasePage {
  readonly page: Page;
  readonly logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger(this.constructor.name);
  }

  async navigateTo(path: string): Promise<void> {
    this.logger.info(`Navigating to "${path}"`);
    try {
      await this.page.goto(path);
      this.logger.info(`Navigated to "${path}"`);
    } catch (error) {
      this.logger.error(`Failed to navigate to "${path}": ${describeError(error)}`);
      throw error;
    }
  }
}
