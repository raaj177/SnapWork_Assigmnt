import messages from '../test-data/messages.json';

export const msg = {
  mismatch: messages.mismatch,
  lockedOut: messages.lockedOut,
  usernameRequired: messages.usernameRequired,
  passwordRequired: messages.passwordRequired,
  protectedRoute: (route: string): string => messages.protectedRoute.replace('{route}', route),
};
