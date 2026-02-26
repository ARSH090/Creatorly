import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver } from '../utils/webdriver';
import { login, waitForElement } from '../utils/helpers';
import { config } from '../config';

describe('Admin Panel Validation', () => {
    let driver: WebDriver;

    beforeAll(async () => {
        driver = await createDriver();
    });

    afterAll(async () => {
        await driver.quit();
    });

    it('should block regular users from admin dashboard', async () => {
        await login(driver, 'user');
        await driver.get(`${config.baseUrl}/admin/dashboard`);

        // Middleware should redirect back to /dashboard or show unauthorized
        await driver.wait(until.urlContains('/dashboard'), 10000);
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).not.toContain('/admin');
    }, 60000);

    it('should allow admin users to access admin dashboard', async () => {
        // We'll logout and login as admin (assuming we have admin credentials)
        await driver.manage().deleteAllCookies();
        await login(driver, 'admin');

        await driver.get(`${config.baseUrl}/admin/dashboard`);
        const statsHeader = await waitForElement(driver, 'h1');
        const text = await statsHeader.getText();
        expect(text.toLowerCase()).toContain('admin');
    }, 60000);

    it('should load user management list', async () => {
        await driver.get(`${config.baseUrl}/admin/users`);
        const userTable = await waitForElement(driver, 'table');
        expect(userTable).toBeDefined();

        const firstUser = await driver.findElement(By.xpath("//td[contains(text(), 'testcreator')]"));
        expect(firstUser).toBeDefined();
    }, 60000);
});
