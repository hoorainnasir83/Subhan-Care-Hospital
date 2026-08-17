module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/setup.js'],
  testMatch: ['**/*.test.js'],
  verbose: true,
  clearMocks: true
};
