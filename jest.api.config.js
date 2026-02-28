/** @type {import('jest').Config} */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.test') });
console.log('DEBUG: MONGODB_URI from config:', process.env.MONGODB_URI);
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testMatch: [
        '**/__tests__/api/**/*.test.[jt]s',
        '**/__tests__/security/**/*.test.[jt]s',
        '**/__tests__/performance/**/*.test.[jt]s',
        '**/__tests__/unit/**/*.test.[jt]s',
    ],

    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            }
        }]
    },
    collectCoverageFrom: [
        'src/app/api/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/lib/models/**',
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/',
    ],
    testTimeout: 30000, // API tests may need more time
    verbose: true,
    bail: false,
    maxConcurrency: 5,
    setupFiles: ['<rootDir>/jest.env.js'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

module.exports = config;
