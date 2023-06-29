const { assert } = require('chai');

const BASE_URL = 'http://localhost:3000/hw/store';

describe('Вёрстка должна быть адаптивной', async function() {
    it('Адаптивная вёрстка при 480x1110, закрытый бургер', async function() {
        await this.browser.url(BASE_URL);
        await this.browser.setWindowSize(480, 1110);
        
        await this.browser.assertView('вёрстка', 'body');
    });

    it('Адаптивная вёрстка при 480x1310, открытый бургер', async function() {
        await this.browser.url(BASE_URL);
        await this.browser.setWindowSize(480, 1310);
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();
        
        await page.click(".Application-Toggler"); // клик, чтобы открыть бургер
        await this.browser.pause(1000);
        // await page.evaluate(() => {
        //     document.querySelector(".Application-Toggler").click();
        // });
        
        await this.browser.assertView('вёрстка', 'body');
    });

    it('Адаптивная вёрстка при 800x1000', async function() {
        await this.browser.url(BASE_URL);
        await this.browser.setWindowSize(800, 1000);
        
        await this.browser.assertView('вёрстка', 'body');
    });

    it('Адаптивная вёрстка при 1920x1080', async function() {
        await this.browser.url(BASE_URL);
        await this.browser.setWindowSize(1920, 1080);
        
        await this.browser.assertView('вёрстка', 'body');
    });
});
