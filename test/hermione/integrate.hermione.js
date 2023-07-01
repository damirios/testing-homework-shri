const { assert } = require('chai');

const BASE_URL = 'http://localhost:3000/hw/store';

describe("Внешний вид корзины.", async function() {
    it("Пустая корзина", async function() {
        await this.browser.url(BASE_URL + '/cart');
        await this.browser.setWindowSize(1920, 1040);
        
        await this.browser.assertView('вёрстка', 'body', {
        });
    });

    it("Непустая корзина (1 товар)", async function() {
        const productId = 0;
        await this.browser.url(BASE_URL + '/catalog' + `/${productId}`);
        await this.browser.setWindowSize(1920, 1040);
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();

        await page.click(".ProductDetails-AddToCart");
        await this.browser.pause(1000);
        await this.browser.url(BASE_URL + '/cart');

        await this.browser.assertView('вёрстка', 'body', {
            ignoreElements: [".Cart-Table"],
        });
    });

    it("Непустая корзина (1 товар). Всё остаётся неизменным при перезагрузке страницы", async function() {
        const productId = 0;
        await this.browser.url(BASE_URL + '/catalog' + `/${productId}`);
        await this.browser.setWindowSize(1920, 1040);
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();

        await page.click(".ProductDetails-AddToCart");
        await this.browser.pause(1000);
        await this.browser.url(BASE_URL + '/cart');

        await page.reload();

        await this.browser.assertView('вёрстка', 'body', {
            ignoreElements: [".Cart-Table"],
        });
    });

    it('Корзина пустая после клика на "очистить корзину"', async function() {
        const productId = 0;
        await this.browser.url(BASE_URL + '/catalog' + `/${productId}`);
        await this.browser.setWindowSize(1920, 1040);
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();

        await page.click(".ProductDetails-AddToCart");
        await this.browser.pause(1000);
        await this.browser.url(BASE_URL + '/cart');

        await page.click(".Cart-Clear");
        await this.browser.pause(1000);

        await this.browser.assertView('вёрстка', 'body');
    });

    it('После успешного чекаута появляется сообщение well done.', async function() {
        const productId = 2;
        await this.browser.url(BASE_URL + '/catalog' + `/${productId}`);
        await this.browser.setWindowSize(1920, 1040);
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();

        await page.click(".ProductDetails-AddToCart");
        await this.browser.pause(1000);
        await this.browser.url(BASE_URL + '/cart');

        await page.focus(".Form-Field_type_name");
        await page.keyboard.type("cool goose");

        await page.focus(".Form-Field_type_phone");
        await page.keyboard.type("1234567898");

        await page.focus(".Form-Field_type_address");
        await page.keyboard.type("top of the world");

        await page.click(".Form-Submit");
        await this.browser.pause(1000);

        await this.browser.assertView('вёрстка', 'body', {
            ignoreElements: [".Cart-Number"]
        });
    });

    it('Чекаута не будет успешным, если в поле номера телефона ввести буквы.', async function() {
        const productId = 3;
        await this.browser.url(BASE_URL + '/catalog' + `/${productId}`);
        await this.browser.setWindowSize(1920, 1040);
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();

        await page.click(".ProductDetails-AddToCart");
        await this.browser.pause(1000);
        await this.browser.url(BASE_URL + '/cart');

        await page.focus(".Form-Field_type_name");
        await page.keyboard.type("cool goose");

        await page.focus(".Form-Field_type_phone");
        await page.keyboard.type("cool goose 123");

        await page.focus(".Form-Field_type_address");
        await page.keyboard.type("top of the world");

        await page.click(".Form-Submit");
        await this.browser.pause(1000);

        await this.browser.assertView('вёрстка', 'body', {
            ignoreElements: [".Form-Field_type_phone", ".Cart-Table"]
        });
    });
});

describe("Внешний вид страницы товара.", async function() {
    it("Подробная страница товара, ширина > 576px.", async function() {
        const productId = 0;
        await this.browser.url(BASE_URL + '/catalog' + `/${productId}`);
        await this.browser.setWindowSize(1920, 1040);
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();
        
        await page.evaluate(() => {
            document.querySelector(".ProductDetails-Name").textContent = "Замоканное название товара";
            document.querySelector(".ProductDetails-Description").textContent = "Чтобы скриншоты не ломались при разном размере динамической информации о товаре";
            document.querySelector(".ProductDetails-Price").textContent = "$120";
            document.querySelector(".ProductDetails-Color").textContent = "Cyan";
            document.querySelector(".ProductDetails-Material").textContent = "Wooden";
        });
        await this.browser.assertView('вёрстка', 'body');
    });

    it("Подробная страница товара, ширина <= 576px.", async function() {
        const productId = 0;
        await this.browser.url(BASE_URL + '/catalog' + `/${productId}`);
        await this.browser.setWindowSize(480, 1110);
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();
        
        await page.evaluate(() => {
            document.querySelector(".ProductDetails-Name").textContent = "Замоканное название товара";
            document.querySelector(".ProductDetails-Description").textContent = "Чтобы скриншоты не ломались при разном размере динамической информации о товаре";
            document.querySelector(".ProductDetails-Price").textContent = "$120";
            document.querySelector(".ProductDetails-Color").textContent = "Cyan";
            document.querySelector(".ProductDetails-Material").textContent = "Wooden";
        });
        await this.browser.assertView('вёрстка', 'body');
    });
});

describe("Внешний вид главной.", async function() {
    it("Главная страница, ширина > 576px.", async function() {
        await this.browser.url(BASE_URL);
        await this.browser.setWindowSize(1920, 1080);
        await this.browser.assertView('вёрстка', 'body');
    });

    it("Подробная страница товара, ширина <= 576px.", async function() {
        await this.browser.url(BASE_URL);
        await this.browser.setWindowSize(480, 1310);
        await this.browser.assertView('вёрстка', 'body');
    });
});

describe("Внешний вид страницы условий доставки.", async function() {
    it("Условия доставки, ширина > 576px.", async function() {
        await this.browser.url(BASE_URL + "/delivery");
        await this.browser.setWindowSize(1920, 1080);
        await this.browser.assertView('вёрстка', 'body');
    });

    it("Условия доставки, ширина <= 576px.", async function() {
        await this.browser.url(BASE_URL + "/delivery");
        await this.browser.setWindowSize(480, 1310);
        await this.browser.assertView('вёрстка', 'body');
    });
});

describe("Внешний вид страницы с контактами.", async function() {
    it("Контакты, ширина > 576px.", async function() {
        await this.browser.url(BASE_URL + "/contacts");
        await this.browser.setWindowSize(1920, 1080);
        await this.browser.assertView('вёрстка', 'body');
    });

    it("Контакты, ширина <= 576px.", async function() {
        await this.browser.url(BASE_URL + "/contacts");
        await this.browser.setWindowSize(480, 1310);
        await this.browser.assertView('вёрстка', 'body');
    });
});

describe("Внешний вид каталога.", async function() {
    it("Каталог, ширина > 576px. Название товаров замокано, чтобы карточка товара не удлиннялась.", async function() {
        await this.browser.url(BASE_URL + '/catalog');
        await this.browser.setWindowSize(1920, 1040);
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();
        
        await page.evaluate(() => {
            const titles = document.querySelectorAll(".ProductItem-Name");
            titles.forEach(title => {
                if (title.textContent) {
                    title.textContent = "Замоканное название";
                }
            });
        });

        await this.browser.assertView('вёрстка', 'body', {
            ignoreElements: [".ProductItem-Price"],
            compositeImage: false,
            allowViewportOverflow: true
        });
    });

    it("Каталог, ширина <= 576px. Название товаров замокано, чтобы карточка товара не удлиннялась.", async function() {
        await this.browser.url(BASE_URL + '/catalog');
        await this.browser.setWindowSize(480, 30440);
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();
        
        await page.evaluate(() => {
            const titles = document.querySelectorAll(".ProductItem-Name");
            titles.forEach(title => {
                if (title.textContent) {
                    title.textContent = "Замоканное название";
                }
            });
        });

        await this.browser.assertView('вёрстка', 'body', {
            ignoreElements: [".ProductItem-Price"],
            compositeImage: false,
            allowViewportOverflow: true,
            screenshotDelay: 1000,
        });
    });
});