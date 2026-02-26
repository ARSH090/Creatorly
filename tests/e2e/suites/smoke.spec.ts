import { WebDriver } from 'selenium-webdriver';
import { createDriver } from '../utils/webdriver';
import { config } from '../config';

describe('Creatorly Smoke Test', () => {
    let driver: WebDriver;

    beforeAll(async () => {
        driver = await createDriver();
    });

    afterAll(async () => {
        await driver.quit();
    });

    it('should load the homepage', async () => {
        await driver.get(config.baseUrl);
        const title = await driver.getTitle();
        expect(title).toBeDefined();
    }, 180000);
});
