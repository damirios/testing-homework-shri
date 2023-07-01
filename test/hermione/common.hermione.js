const { assert } = require('chai');

const BASE_URL = 'http://localhost:3000/hw/store';

describe('Вёрстка должна быть адаптивной.', async function() {
    it('Адаптивная вёрстка при 480x1110, закрытый бургер.', async function() {
        await this.browser.url(BASE_URL);
        await this.browser.setWindowSize(480, 1110);
        
        await this.browser.assertView('вёрстка', 'body');
    });

    it('Адаптивная вёрстка при 480x1310, открытый бургер.', async function() {
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

    it('Адаптивная вёрстка при 800x1000.', async function() {
        await this.browser.url(BASE_URL);
        await this.browser.setWindowSize(800, 1000);
        
        await this.browser.assertView('вёрстка', 'body');
    });

    it('Адаптивная вёрстка при 1920x1080.', async function() {
        await this.browser.url(BASE_URL);
        await this.browser.setWindowSize(1920, 1080);
        
        await this.browser.assertView('вёрстка', 'body');
    });
});

describe('В магазин должны быть страницы: главная, каталог, условия доставки, контакты.', async function() {
    it('Наличие страницы "Главная" (статичная вёрстка).', async function() {
        await this.browser.url(BASE_URL);
        await this.browser.setWindowSize(1920, 1080);
        
        await this.browser.assertView('вёрстка', 'body');
    });

    it('Наличие страницы "Каталог. Наличие на карточке товара названия, цены и ссылки на подробную страницу."', async function() {
        await this.browser.url(BASE_URL + '/catalog');
        await this.browser.setWindowSize(1920, 1040);
        
        await this.browser.assertView('вёрстка', 'body', {
            ignoreElements: [".card-title", ".card-text"],
            compositeImage: false,
            allowViewportOverflow: true
        });
    });

    it('Наличие страницы "Условия доставки" (статичная вёрстка).', async function() {
        await this.browser.url(BASE_URL + '/delivery');
        await this.browser.setWindowSize(1920, 1080);
        
        await this.browser.assertView('вёрстка', 'body');
    });

    it('Наличие страницы "Контакты" (статичная вёрстка).', async function() {
        await this.browser.url(BASE_URL + '/contacts');
        await this.browser.setWindowSize(1920, 1080);
        
        await this.browser.assertView('вёрстка', 'body');
    });
});