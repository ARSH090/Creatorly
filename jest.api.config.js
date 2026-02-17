/** @type {import('jest').Config} */
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testMatch: [
        '**/__tests__/api/**/*.test.[jt]s',
        '**/__tests__/security/**/*.test.[jt]s',
        '**/__tests__/performance/**/*.test.[jt]s',
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
};

module.exports = config;
