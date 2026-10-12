import { $ } from '@wdio/globals';
import type { ChainablePromiseElement } from 'webdriverio';
import { env } from '../config/env';
import { describeError, Logger } from '../utils/logger';

// A locator is a factory: $() starts searching immediately, so it is called at use time to avoid stale elements.
export type ElementLocator = () => ChainablePromiseElement;

export abstract class BasePage {
  readonly logger: Logger;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  byId(id: string): ElementLocator {
    return () => $(`id=${env.appPackage}:id/${id}`);
  }

  bySystemId(id: string): ElementLocator {
    return () => $(`id=android:id/${id}`);
  }

  byAccessibilityId(label: string): ElementLocator {
    return () => $(`~${label}`);
  }

  async tap(locator: ElementLocator, name: string): Promise<void> {
    this.logger.info(`Tapping ${name}`);
    try {
      const element = locator();
      await element.waitForDisplayed();
      await element.click();
      this.logger.info(`Tapped ${name}`);
    } catch (error) {
      this.logger.error(`Failed to tap ${name}: ${describeError(error)}`);
      throw error;
    }
  }

  async type(locator: ElementLocator, text: string, name: string, sensitive = false): Promise<void> {
    this.logger.info(`Typing into ${name}${sensitive ? '' : `: "${text}"`}`);
    try {
      const element = locator();
      await element.waitForDisplayed();
      await element.setValue(text);
      this.logger.info(`Typed into ${name}`);
    } catch (error) {
      this.logger.error(`Failed to type into ${name}: ${describeError(error)}`);
      throw error;
    }
  }
}
