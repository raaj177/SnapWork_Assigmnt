import { $, driver } from '@wdio/globals';
import { env } from '../config/env';
import { describeError, Logger } from './logger';

const logger = new Logger('App');

// pm clear is denied on the test device, so a restart is used to reset the in-memory login state.
export async function restartApp(): Promise<void> {
  logger.info('Restarting the app');
  try {
    await driver.terminateApp(env.appPackage);
    await driver.activateApp(env.appPackage);
    await $(`id=${env.appPackage}:id/productTV`).waitForDisplayed({ timeout: 30_000 });
    logger.info('App restarted');
  } catch (error) {
    logger.error(`Failed to restart the app: ${describeError(error)}`);
    throw error;
  }
}

export async function terminateApp(): Promise<void> {
  logger.info('Terminating the app');
  try {
    await driver.terminateApp(env.appPackage);
    logger.info('App terminated');
  } catch (error) {
    logger.error(`Failed to terminate the app: ${describeError(error)}`);
  }
}

export async function bringAppToFront(): Promise<void> {
  logger.info('Bringing the app to the foreground');
  try {
    await driver.activateApp(env.appPackage);
    logger.info('App is in the foreground');
  } catch (error) {
    logger.error(`Failed to bring the app to the foreground: ${describeError(error)}`);
    throw error;
  }
}

// Passes while the known defect exists and fails once the app starts behaving as specified.
export async function expectKnownIssue(reason: string, check: () => Promise<void>): Promise<void> {
  try {
    await check();
  } catch {
    return;
  }
  throw new Error(`Known issue appears fixed (${reason}). Convert this test to a normal assertion.`);
}
