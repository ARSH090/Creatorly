module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.spec.ts'],
    testTimeout: 300000,
    verbose: true,
    setupFilesAfterEnv: ['./tests/e2e/setup.ts']
};
