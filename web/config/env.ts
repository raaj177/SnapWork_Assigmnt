import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const logLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
const requestedLogLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase();

export const env = {
  baseUrl: (process.env.BASE_URL ?? 'https://www.saucedemo.com').replace(/\/$/, ''),
  headless: (process.env.HEADLESS ?? 'true').toLowerCase() !== 'false',
  logLevel: logLevels.find((level) => level === requestedLogLevel) ?? 'info',
};

export const sessionCookieName = 'session-username';
