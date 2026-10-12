import { Browser, BrowserContext, Page, TestInfo } from '@playwright/test';
import { env } from '../config/env';
import { describeError, Logger } from './logger';

const logger = new Logger('Hooks');

export async function createContext(browser: Browser): Promise<BrowserContext> {
  logger.info('Creating a browser context');
  return browser.newContext({ baseURL: env.baseUrl, viewport: { width: 1280, height: 720 } });
}

// A page created in beforeAll is not captured by the built-in screenshot option.
export async function attachScreenshotOnFailure(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) return;
  try {
    await testInfo.attach('failure-screenshot', { body: await page.screenshot(), contentType: 'image/png' });
    logger.error(`Test failed, screenshot attached: ${testInfo.title}`);
  } catch (error) {
    logger.error(`Could not capture a failure screenshot: ${describeError(error)}`);
  }
}
