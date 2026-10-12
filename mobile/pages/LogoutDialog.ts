import { expect } from '@wdio/globals';
import { messages } from '../test-data/messages';
import { describeError } from '../utils/logger';
import { BasePage, ElementLocator } from './BasePage';

export class LogoutDialog extends BasePage {
  readonly message: ElementLocator;
  readonly logoutButton: ElementLocator;
  readonly cancelButton: ElementLocator;

  constructor() {
    super();
    this.message = this.bySystemId('message');
    this.logoutButton = this.bySystemId('button1');
    this.cancelButton = this.bySystemId('button2');
  }

  async verifyVisible(): Promise<void> {
    this.logger.info('Verifying the logout dialog');
    try {
      await expect(this.message()).toBeDisplayed();
      await expect(this.message()).toHaveText(messages.logoutDialog);
      this.logger.info('Logout dialog verified');
    } catch (error) {
      this.logger.error(`Logout dialog verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyClosed(): Promise<void> {
    this.logger.info('Verifying the logout dialog is closed');
    try {
      await expect(this.message()).not.toBeDisplayed();
      this.logger.info('Logout dialog is closed');
    } catch (error) {
      this.logger.error(`Logout dialog is still open: ${describeError(error)}`);
      throw error;
    }
  }

  async confirm(): Promise<void> {
    this.logger.info('Confirming the logout');
    try {
      await this.tap(this.logoutButton, 'the LOGOUT button');
      this.logger.info('Logout confirmed');
    } catch (error) {
      this.logger.error(`Failed to confirm the logout: ${describeError(error)}`);
      throw error;
    }
  }

  async cancel(): Promise<void> {
    this.logger.info('Cancelling the logout');
    try {
      await this.tap(this.cancelButton, 'the CANCEL button');
      this.logger.info('Logout cancelled');
    } catch (error) {
      this.logger.error(`Failed to cancel the logout: ${describeError(error)}`);
      throw error;
    }
  }
}
