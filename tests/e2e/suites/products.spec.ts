import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver } from '../utils/webdriver';
import { login, takeScreenshot, waitForElement } from '../utils/helpers';
import { config } from '../config';

describe('Product Workflow - Creation to Purchase', () => {
    let driver: WebDriver;

    beforeAll(async () => {
        driver = await createDriver();
        await login(driver, 'user');
    });

    afterAll(async () => {
        await driver.quit();
    });

    it('should create a new digital product', async () => {
        await driver.get(`${config.baseUrl}/dashboard/products/new`);

        const titleInput = await waitForElement(driver, 'input[name="title"]');
        await titleInput.sendKeys('QA Test Digital Product');

        const priceInput = await driver.findElement(By.name('price'));
        await priceInput.sendKeys('999');

        const descInput = await driver.findElement(By.name('description'));
        await descInput.sendKeys('This is a test product created by Selenium.');

        const submitButton = await driver.findElement(By.css('button[type="submit"]'));
        await submitButton.click();

        await driver.wait(until.urlContains('/dashboard/products'), 15000);
        const successToast = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'created')]")), 10000);
        expect(successToast).toBeDefined();
    }, 90000);

    it('should publish the product and verify on storefront', async () => {
        // Find the product in the list and toggle publish
        await driver.get(`${config.baseUrl}/dashboard/products`);
        const publishToggle = await waitForElement(driver, 'button[role="switch"]'); // Assuming Radix/Shadcn switch
        await publishToggle.click();

        const statusText = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Active')]")), 10000);
        expect(statusText).toBeDefined();

        // Check storefront
        await driver.get(`${config.baseUrl}/testcreator`);
        const productLink = await waitForElement(driver, 'a[href*="qa-test-digital-product"]');
        expect(productLink).toBeDefined();
    }, 90000);

    it('should complete a purchase flow (Simulation)', async () => {
        await driver.get(`${config.baseUrl}/testcreator/qa-test-digital-product`);

        const buyButton = await waitForElement(driver, 'button');
        await buyButton.click();

        // Enter dummy details in checkout
        const emailInput = await waitForElement(driver, 'input[type="email"]');
        await emailInput.sendKeys('customer@example.com');

        const payButton = await driver.findElement(By.xpath("//button[contains(text(), 'Pay')]"));
        await payButton.click();

        // Wait for Razorpay modal or success redirect
        // In test mode, we might need to handle the Razorpay iframe
        // For simplicity, we check for a success message or redirect to /thank-you
        await driver.wait(until.urlContains('/thank-you'), 30000);
        const successMessage = await waitForElement(driver, 'h1');
        const text = await successMessage.getText();
        expect(text.toLowerCase()).toContain('thank you');
    }, 120000);
});
