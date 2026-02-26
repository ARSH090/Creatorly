import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver } from '../utils/webdriver';
import { config } from '../config';
import { waitForElement } from '../utils/helpers';

describe('Public Storefront Flow', () => {
    let driver: WebDriver;

    beforeAll(async () => {
        driver = await createDriver();
    });

    afterAll(async () => {
        await driver.quit();
    });

    it('should load the homepage with correct title', async () => {
        await driver.get(config.baseUrl);
        const title = await driver.getTitle();
        expect(title.toLowerCase()).toContain('creatorly');
    }, 60000);

    it('should load the creator storefront', async () => {
        await driver.get(`${config.baseUrl}/testcreator`);

        // Wait for profile name
        const profileName = await waitForElement(driver, 'h1');
        const text = await profileName.getText();
        expect(text).toContain('Test Creator');
    }, 60000);

    it('should load the product page', async () => {
        await driver.get(`${config.baseUrl}/testcreator/ultimate-creator-bundle`);

        // Wait for product title
        const productTitle = await waitForElement(driver, 'h1');
        const text = await productTitle.getText();
        expect(text).toContain('Ultimate Creator Bundle');

        // Check price display
        const price = await driver.findElement(By.xpath("//*[contains(text(), '499')]"));
        expect(price).toBeDefined();
    }, 60000);

    it('should open checkout modal on click', async () => {
        await driver.get(`${config.baseUrl}/testcreator/ultimate-creator-bundle`);

        const buyButton = await waitForElement(driver, 'button', 20000); // Wait for any button (usually "Buy Now")
        await buyButton.click();

        // Wait for modal or redirect to checkout
        // Based on the app logic, it might be a modal or a route
        // We'll check for "Checkout" or "Personal Information" text
        const checkoutHeading = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Checkout') or contains(text(), 'Information')]")), 15000);
        expect(checkoutHeading).toBeDefined();
    }, 60000);
});
