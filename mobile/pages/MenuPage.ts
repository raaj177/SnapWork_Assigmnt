import { expect } from '@wdio/globals';
import { describeError } from '../utils/logger';
import { BasePage, ElementLocator } from './BasePage';

export class MenuPage extends BasePage {
  readonly menuButton: ElementLocator;
  readonly loginItem: ElementLocator;
  readonly logoutItem: ElementLocator;

  constructor() {
    super();
    this.menuButton = this.byAccessibilityId('View menu');
    this.loginItem = this.byAccessibilityId('Login Menu Item');
    this.logoutItem = this.byAccessibilityId('Logout Menu Item');
  }

  async open(): Promise<void> {
    this.logger.info('Opening the menu');
    try {
      await this.tap(this.menuButton, 'the menu button');
      this.logger.info('Menu opened');
    } catch (error) {
      this.logger.error(`Failed to open the menu: ${describeError(error)}`);
      throw error;
    }
  }

  async openLogin(): Promise<void> {
    this.logger.info('Opening the Login screen from the menu');
    try {
      await this.open();
      await this.tapLogin();
      this.logger.info('Login screen requested');
    } catch (error) {
      this.logger.error(`Failed to open the Login screen: ${describeError(error)}`);
      throw error;
    }
  }

  async tapLogin(): Promise<void> {
    this.logger.info('Tapping the Log In menu item');
    try {
      await this.tap(this.loginItem, 'the Log In menu item');
      this.logger.info('Log In menu item tapped');
    } catch (error) {
      this.logger.error(`Failed to tap the Log In menu item: ${describeError(error)}`);
      throw error;
    }
  }

  async tapLogout(): Promise<void> {
    this.logger.info('Tapping the Log Out menu item');
    try {
      await this.tap(this.logoutItem, 'the Log Out menu item');
      this.logger.info('Log Out menu item tapped');
    } catch (error) {
      this.logger.error(`Failed to tap the Log Out menu item: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyLoginItemVisible(): Promise<void> {
    this.logger.info('Verifying the Log In menu item is visible');
    try {
      await expect(this.loginItem()).toBeDisplayed();
      this.logger.info('Log In menu item is visible');
    } catch (error) {
      this.logger.error(`Log In menu item is not visible: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyLoginItemAbsent(): Promise<void> {
    this.logger.info('Verifying the Log In menu item is absent');
    try {
      await expect(this.loginItem()).not.toBeDisplayed();
      this.logger.info('Log In menu item is absent');
    } catch (error) {
      this.logger.error(`Log In menu item is still visible: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyLogoutItemVisible(): Promise<void> {
    this.logger.info('Verifying the Log Out menu item is visible');
    try {
      await expect(this.logoutItem()).toBeDisplayed();
      this.logger.info('Log Out menu item is visible');
    } catch (error) {
      this.logger.error(`Log Out menu item is not visible: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyLogoutItemAbsent(): Promise<void> {
    this.logger.info('Verifying the Log Out menu item is absent');
    try {
      await expect(this.logoutItem()).not.toBeDisplayed();
      this.logger.info('Log Out menu item is absent');
    } catch (error) {
      this.logger.error(`Log Out menu item is still visible: ${describeError(error)}`);
      throw error;
    }
  }
}
