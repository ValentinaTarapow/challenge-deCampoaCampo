module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.(test|spec).[jt]s?(x)'],
  clearMocks: true,
  watchman: false,
};
