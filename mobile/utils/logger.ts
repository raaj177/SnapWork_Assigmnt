import { env, LogLevel } from '../config/env';

const severity: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message.split('\n')[0] : String(error);
}

export class Logger {
  readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string): void {
    this.log('debug', message);
  }

  info(message: string): void {
    this.log('info', message);
  }

  warn(message: string): void {
    this.log('warn', message);
  }

  error(message: string): void {
    this.log('error', message);
  }

  log(level: LogLevel, message: string): void {
    if (severity[level] < severity[env.logLevel]) return;
    const line = `${new Date().toISOString()} [${level.toUpperCase()}] [${this.context}] ${message}`;
    if (level === 'error') console.error(line);
    else console.log(line);
  }
}
