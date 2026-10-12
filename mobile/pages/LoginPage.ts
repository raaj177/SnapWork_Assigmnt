import { browser, expect } from '@wdio/globals';
import { describeError } from '../utils/logger';
import { BasePage, ElementLocator } from './BasePage';

export class LoginPage extends BasePage {
  readonly title: ElementLocator;
  readonly usernameInput: ElementLocator;
  readonly passwordInput: ElementLocator;
  readonly loginButton: ElementLocator;
  readonly usernameError: ElementLocator;
  readonly passwordError: ElementLocator;
  readonly listedBodUser: ElementLocator;

  constructor() {
    super();
    this.title = this.byId('loginTV');
    this.usernameInput = this.byId('nameET');
    this.passwordInput = this.byId('passwordET');
    this.loginButton = this.byId('loginBtn');
    this.usernameError = this.byId('nameErrorTV');
    this.passwordError = this.byId('passwordErrorTV');
    this.listedBodUser = this.byId('username1TV');
  }

  async login(username: string, password: string): Promise<void> {
    this.logger.info(`Login started for username "${username}"`);
    try {
      if (username) await this.type(this.usernameInput, username, 'the Username field');
      if (password) await this.type(this.passwordInput, password, 'the Password field', true);
      await this.tap(this.loginButton, 'the Login button');
      this.logger.info('Login submitted');
    } catch (error) {
      this.logger.error(`Login failed for username "${username}": ${describeError(error)}`);
      throw error;
    }
  }

  async enterPassword(password: string): Promise<void> {
    this.logger.info('Entering the password');
    try {
      await this.type(this.passwordInput, password, 'the Password field', true);
      this.logger.info('Password entered');
    } catch (error) {
      this.logger.error(`Failed to enter the password: ${describeError(error)}`);
      throw error;
    }
  }

  async tapListedBodUser(): Promise<void> {
    this.logger.info('Tapping the listed bod@example.com username');
    try {
      await this.tap(this.listedBodUser, 'the listed username');
      this.logger.info('Listed username tapped');
    } catch (error) {
      this.logger.error(`Failed to tap the listed username: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyVisible(): Promise<void> {
    this.logger.info('Verifying the Login screen');
    try {
      await expect(this.title()).toBeDisplayed();
      await expect(this.usernameInput()).toBeDisplayed();
      await expect(this.passwordInput()).toBeDisplayed();
      await expect(this.loginButton()).toBeDisplayed();
      this.logger.info('Login screen verified');
    } catch (error) {
      this.logger.error(`Login screen verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyPasswordMasked(): Promise<void> {
    this.logger.info('Verifying that the password is masked');
    try {
      await expect(this.passwordInput()).toHaveAttribute('password', 'true');
      this.logger.info('Password is masked');
    } catch (error) {
      this.logger.error(`Password masking verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyUsernameFilled(username: string): Promise<void> {
    this.logger.info(`Verifying the username is "${username}"`);
    try {
      await expect(this.usernameInput()).toHaveText(username);
      this.logger.info('Username verified');
    } catch (error) {
      this.logger.error(`Username verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyPasswordFilled(): Promise<void> {
    this.logger.info('Verifying the password field is filled');
    try {
      await expect(this.passwordInput()).not.toHaveText('');
      this.logger.info('Password field is filled');
    } catch (error) {
      this.logger.error(`Password field is empty: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyFieldsEmpty(): Promise<void> {
    this.logger.info('Verifying both fields are empty');
    try {
      await expect(this.usernameInput()).toHaveText('');
      await expect(this.passwordInput()).toHaveText('');
      this.logger.info('Both fields are empty');
    } catch (error) {
      this.logger.error(`Fields are not empty: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyUsernameError(message: string): Promise<void> {
    this.logger.info(`Verifying the username error "${message}"`);
    try {
      await expect(this.usernameError()).toBeDisplayed();
      await expect(this.usernameError()).toHaveText(message);
      this.logger.info('Username error verified');
    } catch (error) {
      this.logger.error(`Username error verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyPasswordError(message: string): Promise<void> {
    this.logger.info(`Verifying the password error "${message}"`);
    try {
      await expect(this.passwordError()).toBeDisplayed();
      await expect(this.passwordError()).toHaveText(message);
      this.logger.info('Password error verified');
    } catch (error) {
      this.logger.error(`Password error verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyNoPasswordError(): Promise<void> {
    this.logger.info('Verifying no password error is shown');
    try {
      await expect(this.passwordError()).not.toBeDisplayed();
      this.logger.info('No password error is shown');
    } catch (error) {
      this.logger.error(`A password error is shown: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyLoginRejected(): Promise<void> {
    this.logger.info('Verifying the login was rejected');
    try {
      await expect(this.loginButton()).toBeDisplayed();
      await browser.waitUntil(
        async () => (await this.usernameError().isDisplayed()) || (await this.passwordError().isDisplayed()),
        { timeout: 3000, timeoutMsg: 'No login error message is displayed' },
      );
      this.logger.info('Login was rejected with an error message');
    } catch (error) {
      this.logger.error(`Login was not rejected: ${describeError(error)}`);
      throw error;
    }
  }
}
