import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { env } from '../config/env';

function adbPath(): string {
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  return sdk ? join(sdk, 'platform-tools', 'adb') : 'adb';
}

export function listAdbDevices(): string[] {
  const output = execFileSync(adbPath(), ['devices'], { encoding: 'utf-8' });
  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => /\sdevice$/.test(line))
    .map((line) => line.replace(/\s+device$/, ''));
}

// Appium splits `adb devices` output on whitespace, so a serial containing a space is never matched.
export function assertUsableDevice(): void {
  const devices = listAdbDevices();
  if (devices.length === 0) {
    throw new Error('No Android device is connected. Run `adb devices` and reconnect the phone before starting the tests.');
  }

  const target = env.udid ?? devices[0];
  if (env.udid && !devices.includes(env.udid)) {
    throw new Error(`ANDROID_UDID "${env.udid}" is not in \`adb devices\`: ${devices.join(', ')}`);
  }
  if (/\s/.test(target)) {
    throw new Error(
      `The adb device name "${target}" contains a space, which Appium cannot use. ` +
        'Reconnect with `adb disconnect && adb connect <ip>:<port>` (or use a USB cable) and set ANDROID_UDID to the new name.',
    );
  }
}
