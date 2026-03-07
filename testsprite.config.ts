import { defineConfig } from 'testsprite'

export default defineConfig({
    baseURL: 'http://localhost:3000',
    auth: {
        email: process.env.TEST_USER_EMAIL!,
        password: process.env.TEST_USER_PASSWORD!,
        loginURL: '/sign-in',
        successRedirect: '/dashboard',
    },
    testDir: './testsprite',
    outputDir: './testsprite/results',
    screenshotDir: './testsprite/screenshots',
    viewport: { width: 1280, height: 800 },
    mobileViewport: { width: 375, height: 812 },
    timeout: 30000,
    retries: 1,
    parallel: false,
})
