import { WebDriver, By, until } from 'selenium-webdriver';
import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

export async function login(driver: WebDriver, role: 'user' | 'admin' = 'user') {
    const credentials = role === 'admin' ? config.adminUser : config.testUser;

    await driver.get(`${config.baseUrl}/auth/login`);

    const emailInput = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 15000);
    await emailInput.sendKeys(credentials.email);

    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.sendKeys(credentials.password);

    const submitButton = await driver.findElement(By.css('button[type="submit"]'));
    await submitButton.click();

    await driver.wait(until.urlContains('/dashboard'), 15000);
}

export async function takeScreenshot(driver: WebDriver, testName: string) {
    const screenshot = await driver.takeScreenshot();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${testName}_${timestamp}.png`;
    const filePath = path.join(config.screenshotsDir, fileName);

    if (!fs.existsSync(config.screenshotsDir)) {
        fs.mkdirSync(config.screenshotsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, screenshot, 'base64');
    return filePath;
}

export async function waitForElement(driver: WebDriver, cssSelector: string, timeout: number = 10000) {
    return await driver.wait(until.elementLocated(By.css(cssSelector)), timeout);
}
