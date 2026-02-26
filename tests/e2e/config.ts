export const config = {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    headless: process.env.HEADLESS !== 'false',
    timeout: 30000,
    retries: 3,
    screenshotsDir: './test-reports/screenshots',
    logsDir: './test-reports/logs',
    testUser: {
        email: process.env.TEST_USER_EMAIL || 'test@creatorly.in',
        password: process.env.TEST_USER_PASSWORD || 'Password123!',
    },
    adminUser: {
        email: process.env.ADMIN_EMAIL || 'admin@creatorly.in',
        password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
    }
};
