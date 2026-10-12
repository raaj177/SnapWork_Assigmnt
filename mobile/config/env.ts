import 'dotenv/config';


export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const logLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
const requestedLogLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase();

export const env = {
  logLevel: logLevels.find((level) => level === requestedLogLevel) ?? 'info',
  udid: process.env.ANDROID_UDID || undefined,
  deviceName: process.env.DEVICE_NAME || 'Android Device',
  appPackage: process.env.APP_PACKAGE || 'com.saucelabs.mydemoapp.android',
  appActivity: process.env.APP_ACTIVITY || 'com.saucelabs.mydemoapp.android.view.activities.SplashActivity',
  appPath: process.env.APP_PATH || undefined,
  appiumPort: Number(process.env.APPIUM_PORT || 4723),
};
