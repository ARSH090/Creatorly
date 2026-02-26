import { Builder, WebDriver, logging } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { config } from '../config';

export async function createDriver(): Promise<WebDriver> {
    const options = new chrome.Options();

    if (config.headless) {
        options.addArguments('--headless=new');
    }

    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--remote-debugging-port=9222');
    options.addArguments('--window-size=1920,1080');

    // Enable console log capturing
    const prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
    options.setLoggingPrefs(prefs);

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    return driver;
}

export async function captureConsoleLogs(driver: WebDriver) {
    const logs = await driver.manage().logs().get(logging.Type.BROWSER);
    return logs.map(log => ({
        level: log.level.name,
        message: log.message,
        timestamp: new Date(log.timestamp).toISOString()
    }));
}

export async function capturePerformanceMetrics(driver: WebDriver) {
    const metrics = await driver.executeScript('return window.performance.timing');
    return metrics;
}
