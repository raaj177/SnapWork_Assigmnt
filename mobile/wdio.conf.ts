import { mkdirSync, writeFileSync } from 'node:fs';
import allureReporter from '@wdio/allure-reporter';
import { browser } from '@wdio/globals';
import { env } from './config/env';
import { assertUsableDevice } from './utils/device';

export const config: WebdriverIO.Config = {
  runner: 'local',
  port: env.appiumPort,
  specs: ['./tests/**/*.spec.ts'],
  maxInstances: 1,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': env.deviceName,
      ...(env.udid ? { 'appium:udid': env.udid } : {}),
      ...(env.appPath ? { 'appium:app': env.appPath } : {}),
      'appium:appPackage': env.appPackage,
      'appium:appActivity': env.appActivity,
      'appium:appWaitActivity': '*',
      // The test device denies `pm clear`, so state is reset by restarting the app instead.
      'appium:noReset': true,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 300,
    },
  ],
  logLevel: 'warn',
  waitforTimeout: 10_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 2,
  services: [['appium', { args: { port: env.appiumPort } }]],
  framework: 'mocha',
  reporters: [
    'spec',
    ['allure', { outputDir: 'allure-results', disableWebdriverStepsReporting: true, disableWebdriverScreenshotsReporting: true }],
    ['junit', { outputDir: 'reports/junit', outputFileFormat: (options) => `results-${options.cid}.xml` }],
  ],
  mochaOpts: { ui: 'bdd', timeout: 180_000 },

  onPrepare: () => {
    assertUsableDevice();
  },

  afterTest: async (test, _context, { passed }) => {
    if (passed) return;
    const screenshot = await browser.takeScreenshot();
    const fileName = test.title.replace(/[^\w-]+/g, '_').slice(0, 80);
    mkdirSync('screenshots', { recursive: true });
    writeFileSync(`screenshots/${fileName}.png`, screenshot, 'base64');
    allureReporter.addAttachment('Failure screenshot', Buffer.from(screenshot, 'base64'), 'image/png');
  },
};
