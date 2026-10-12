import { BrowserContext } from '@playwright/test';
import { env, sessionCookieName } from '../config/env';

export async function getSessionCookie(context: BrowserContext): Promise<string | undefined> {
  const cookies = await context.cookies(env.baseUrl);
  return cookies.find((c) => c.name === sessionCookieName)?.value;
}

export async function setSessionCookie(context: BrowserContext, value: string): Promise<void> {
  await context.addCookies([{ name: sessionCookieName, value, url: env.baseUrl }]);
}

export async function allCookieValues(context: BrowserContext): Promise<string[]> {
  return (await context.cookies(env.baseUrl)).map((c) => c.value);
}
