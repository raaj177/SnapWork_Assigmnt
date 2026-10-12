export const users = {
  valid: { username: 'bod@example.com', password: '10203040' },
  lockedOut: { username: 'alice@example.com', password: '10203040' },
  wrongPassword: { username: 'bod@example.com', password: 'wrongpass' },
  unknown: { username: 'unknown@example.com', password: 'wrongpass' },
};

export const payloads = {
  sql: "' OR 1=1 --",
  whitespace: '   ',
};
