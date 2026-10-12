import { expect, Locator, Page } from '@playwright/test';
import { describeError } from '../utils/logger';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly loginButton: Locator;
  readonly errorBanner: Locator;
  readonly dismissErrorButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorBanner = page.getByRole('alert');
    this.dismissErrorButton = page.getByRole('button', { name: 'Dismiss error' });
  }

  async open(): Promise<void> {
    this.logger.info('Opening the login page');
    try {
      await this.navigateTo('/');
      await this.usernameInput.waitFor();
      this.logger.info('Login page opened');
    } catch (error) {
      this.logger.error(`Failed to open the login page: ${describeError(error)}`);
      throw error;
    }
  }

  async isLoaded(): Promise<boolean> {
    this.logger.debug('Checking that the login page is loaded');
    try {
      await this.usernameInput.waitFor({ state: 'visible' });
      await this.loginButton.waitFor({ state: 'visible' });
      this.logger.debug('Login page is loaded');
      return true;
    } catch (error) {
      this.logger.error(`Login page is not loaded: ${describeError(error)}`);
      return false;
    }
  }

  async isLoginButtonEnabled(): Promise<boolean> {
    this.logger.debug('Checking the Login button state');
    try {
      const enabled = await this.loginButton.isEnabled();
      this.logger.debug(`Login button enabled: ${enabled}`);
      return enabled;
    } catch (error) {
      this.logger.error(`Failed to read the Login button state: ${describeError(error)}`);
      throw error;
    }
  }

  async enterUsername(username: string): Promise<void> {
    this.logger.info(`Entering username "${username}"`);
    try {
      await this.usernameInput.fill(username);
      this.logger.info('Username entered');
    } catch (error) {
      this.logger.error(`Failed to enter the username: ${describeError(error)}`);
      throw error;
    }
  }

  // The password input has no ARIA role, so it is reached by keyboard from the Username field.
  async enterPassword(password: string): Promise<void> {
    this.logger.info('Entering the password');
    try {
      await this.focusPassword();
      await this.page.keyboard.type(password);
      this.logger.info('Password entered');
    } catch (error) {
      this.logger.error(`Failed to enter the password: ${describeError(error)}`);
      throw error;
    }
  }

  async submit(): Promise<void> {
    this.logger.info('Clicking Login');
    try {
      await this.loginButton.click();
      this.logger.info('Login clicked');
    } catch (error) {
      this.logger.error(`Failed to click Login: ${describeError(error)}`);
      throw error;
    }
  }

  async submitWithEnterKey(): Promise<void> {
    this.logger.info('Submitting the form with the Enter key');
    try {
      await this.page.keyboard.press('Enter');
      this.logger.info('Enter key pressed');
    } catch (error) {
      this.logger.error(`Failed to press Enter: ${describeError(error)}`);
      throw error;
    }
  }

  async login(username: string, password: string): Promise<void> {
    this.logger.info(`Login started for username "${username}"`);
    try {
      if (username) await this.enterUsername(username);
      if (password) await this.enterPassword(password);
      await this.submit();
      this.logger.info('Login submitted');
    } catch (error) {
      this.logger.error(`Login failed for username "${username}": ${describeError(error)}`);
      throw error;
    }
  }

  async loginWithEnterKey(username: string, password: string): Promise<void> {
    this.logger.info(`Login with the Enter key started for username "${username}"`);
    try {
      await this.enterUsername(username);
      await this.enterPassword(password);
      await this.submitWithEnterKey();
      this.logger.info('Login submitted with the Enter key');
    } catch (error) {
      this.logger.error(`Login with the Enter key failed for username "${username}": ${describeError(error)}`);
      throw error;
    }
  }

  async getUsernameValue(): Promise<string> {
    this.logger.debug('Reading the username value');
    try {
      return await this.usernameInput.inputValue();
    } catch (error) {
      this.logger.error(`Failed to read the username: ${describeError(error)}`);
      throw error;
    }
  }

  async getPasswordValue(): Promise<string> {
    this.logger.debug('Reading the password value');
    try {
      await this.focusPassword();
      return await this.page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.value ?? '');
    } catch (error) {
      this.logger.error(`Failed to read the password value: ${describeError(error)}`);
      throw error;
    }
  }

  async getPasswordFieldType(): Promise<string | undefined> {
    this.logger.debug('Reading the password field type');
    try {
      await this.focusPassword();
      return await this.page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.type);
    } catch (error) {
      this.logger.error(`Failed to read the password field type: ${describeError(error)}`);
      throw error;
    }
  }

  async isPasswordMasked(): Promise<boolean> {
    this.logger.debug('Checking that the password is masked');
    try {
      return (await this.getPasswordFieldType()) === 'password';
    } catch (error) {
      this.logger.error(`Failed to check password masking: ${describeError(error)}`);
      throw error;
    }
  }

  async getErrorText(): Promise<string> {
    this.logger.debug('Reading the error message');
    try {
      if ((await this.errorBanner.count()) === 0) return '';
      return (await this.errorBanner.innerText()).trim();
    } catch (error) {
      this.logger.error(`Failed to read the error message: ${describeError(error)}`);
      throw error;
    }
  }

  async isErrorVisible(): Promise<boolean> {
    this.logger.debug('Checking whether an error is shown');
    try {
      return (await this.errorBanner.count()) > 0;
    } catch (error) {
      this.logger.error(`Failed to check the error banner: ${describeError(error)}`);
      throw error;
    }
  }

  async dismissError(): Promise<void> {
    this.logger.info('Dismissing the error message');
    try {
      await this.dismissErrorButton.click();
      this.logger.info('Error message dismissed');
    } catch (error) {
      this.logger.error(`Failed to dismiss the error message: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyPageVisible(): Promise<void> {
    this.logger.info('Verifying the login page');
    try {
      await expect(this.usernameInput).toBeVisible();
      await expect(this.loginButton).toBeVisible();
      await expect(this.loginButton).toBeEnabled();
      this.logger.info('Login page verified');
    } catch (error) {
      this.logger.error(`Login page verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyPasswordMasked(): Promise<void> {
    this.logger.info('Verifying that the password is masked');
    try {
      await expect.poll(() => this.isPasswordMasked()).toBe(true);
      this.logger.info('Password is masked');
    } catch (error) {
      this.logger.error(`Password masking verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyErrorMessage(expected: string): Promise<void> {
    this.logger.info(`Verifying the error message "${expected}"`);
    try {
      await expect.poll(() => this.getErrorText()).toBe(expected);
      this.logger.info('Error message verified');
    } catch (error) {
      this.logger.error(`Error message verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyLoggedOut(): Promise<void> {
    this.logger.info('Verifying the logged-out state');
    try {
      await expect(this.page).toHaveURL(/\/$/);
      await this.verifyPageVisible();
      await expect(this.usernameInput).toHaveValue('');
      await expect.poll(() => this.getPasswordValue()).toBe('');
      this.logger.info('Logged-out state verified');
    } catch (error) {
      this.logger.error(`Logged-out verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async focusPassword(): Promise<void> {
    this.logger.debug('Moving focus to the password field');
    try {
      await this.usernameInput.focus();
      await this.page.keyboard.press('Tab');
    } catch (error) {
      this.logger.error(`Failed to focus the password field: ${describeError(error)}`);
      throw error;
    }
  }
}
