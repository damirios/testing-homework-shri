import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { Application } from '../../src/client/Application';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { initStore } from '../../src/client/store';

import "@testing-library/jest-dom";
import { CartState, CheckoutFormData, CheckoutResponse, Product, ProductShortInfo } from '../../src/common/types';
import { CartApi, ExampleApi } from '../../src/client/api';
import { AxiosResponse } from 'axios';

describe('Наличие ссылок в шапке', () => {
    let header: HTMLElement;

    beforeEach(() => {
        const productShortInfos = [{
            id: 1, name: 'first product', price: 120
        }, {
            id: 2, name: 'second product', price: 720
        }, {
            id: 3, name: 'third product', price: 43
        }];

        const productFullInfo = {
            description: "Some nice description of a product",
            material: "porcelain",
            color: "white",
            id: 1,
            name: "first product",
            price: 120
        };

        const axiosResponseObj = {
            status: 200,
            statusText: "OK",
            headers: {},
            config: {},
            request: {}
        };

        const basename = '/hw/store';
        const api = new ExampleApi(basename);
        const cart = new CartApi();

        api.getProducts = async function(): Promise<AxiosResponse<ProductShortInfo[], any>> {
            return Promise.resolve({...axiosResponseObj, data: productShortInfos});
        }
        api.getProductById = async function(id: number): Promise<AxiosResponse<Product, any>> {
            return Promise.resolve({...axiosResponseObj, data: {...productFullInfo, id}});
        }
        api.checkout = async function(form: CheckoutFormData, cart: CartState): Promise<AxiosResponse<CheckoutResponse, any>> {
            return Promise.resolve({...axiosResponseObj, data: {id: 2}});
        }

        let cartMock: CartState = {
            1: {
                name: 'cool product',
                price: 542,
                count: 4,
            },
            2: {
                name: 'very cool product',
                price: 859,
                count: 1,
            },
        };
        cart.getState = function(): CartState {
            return cartMock;
        }
        cart.setState = function(cart: CartState) {
            cartMock = {...cartMock, ...cart};
        }
        
        const store = initStore(api, cart);
        const app = (
            <BrowserRouter basename={basename}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </BrowserRouter>
        );
        
        const { getByTestId } = render(app);
        header = getByTestId("header");
    });

    it('Шапка содержит ссылки на страницы магазина и ссылку на корзину', () => {
        const linksRequired = ["/hw/store/catalog", "/hw/store/delivery", "/hw/store/contacts", "/hw/store/cart"];
        const links = header.querySelectorAll("a");
        const hrefs: string[] = [];
        links.forEach(link => hrefs.push(link.getAttribute("href") || ''));
        linksRequired.forEach(linkReq => {
            expect(hrefs).toContain(linkReq);
        });
    });

});

describe("При ширине меньше 576px появляется бургер и скрывается навигационное меню", () => {
    let originWindowWidth: number;
    let navbar: HTMLElement;
    let navbarClasses: string[];
    let burgerButton: HTMLElement;
    const hidingClassName = 'collapse';

    beforeEach(() => {
        originWindowWidth = global.innerWidth;
        global.innerWidth = 480;

        const basename = '/hw/store';
        
        const api = new ExampleApi(basename);
        const cart = new CartApi();

        const productShortInfos = [{
            id: 1, name: 'first product', price: 120
        }, {
            id: 2, name: 'second product', price: 720
        }, {
            id: 3, name: 'third product', price: 43
        }];

        const productFullInfo = {
            description: "Some nice description of a product",
            material: "porcelain",
            color: "white",
            id: 1,
            name: "first product",
            price: 120
        };

        const axiosResponseObj = {
            status: 200,
            statusText: "OK",
            headers: {},
            config: {},
            request: {}
        };

        api.getProducts = async function(): Promise<AxiosResponse<ProductShortInfo[], any>> {
            return Promise.resolve({...axiosResponseObj, data: productShortInfos});
        }
        api.getProductById = async function(id: number): Promise<AxiosResponse<Product, any>> {
            return Promise.resolve({...axiosResponseObj, data: {...productFullInfo, id}});
        }
        api.checkout = async function(form: CheckoutFormData, cart: CartState): Promise<AxiosResponse<CheckoutResponse, any>> {
            return Promise.resolve({...axiosResponseObj, data: {id: 2}});
        }

        let cartProductsMock: CartState = {
            1: {
                name: 'cool product',
                price: 542,
                count: 4,
            },
            2: {
                name: 'very cool product',
                price: 859,
                count: 1,
            },
        };
        cart.getState = function(): CartState {
            return cartProductsMock;
        }
        cart.setState = function(cart: CartState) {
            cartProductsMock = {...cartProductsMock, ...cart};
        }

        const store = initStore(api, cart);
        
        const app = (
            <BrowserRouter basename={basename}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </BrowserRouter>
        );
        
        const { getByTestId } = render(app);
        navbar = getByTestId("navbar-menu");
        burgerButton = getByTestId("burget-toggler");
    });
    
    it('Навигационное меню скрывается в бургере', () => {
        navbarClasses = navbar.className.split(' ');
        expect(navbarClasses).toContain(hidingClassName);
    });

    it('При клике на кнопку бургера меню открывается и закрывается при клике на элемент меню-бургера', async () => {
        if (burgerButton !== null) {
            fireEvent.click(burgerButton);
        }
        expect(navbar.className.split(' ')).not.toContain(hidingClassName); // меню открылось, класс collapse исчез

        // теперь кликаем по элементу меню
        const burgerLinks = navbar.querySelectorAll("a.nav-link");
        if (burgerLinks.length > 0) {
            fireEvent.click(burgerLinks[burgerLinks.length - 1]);
        }
        expect(navbar.className.split(' ')).toContain(hidingClassName); // меню закрылось, класс collapse появился
    });
    
    afterAll(() => {
        global.innerWidth = originWindowWidth;
    }); 
});

describe("Отображение товаров в каталоге", () => {
    let api: ExampleApi;
    let cart: CartApi;
    let basename = "/hw/store";

    beforeEach(() => {        
        api = new ExampleApi(basename);
        cart = new CartApi();

        const productShortInfos = [{
            id: 1, name: 'first product', price: 120
        }, {
            id: 2, name: 'second product', price: 720
        }, {
            id: 3, name: 'third product', price: 43
        }];

        const productFullInfo = {
            description: "Some nice description of a product",
            material: "porcelain",
            color: "white",
            id: 1,
            name: "first product",
            price: 120
        };

        const axiosResponseObj = {
            status: 200,
            statusText: "OK",
            headers: {},
            config: {},
            request: {}
        };

        api.getProducts = async function(): Promise<AxiosResponse<ProductShortInfo[], any>> {
            return Promise.resolve({...axiosResponseObj, data: productShortInfos});
        }
        api.getProductById = async function(id: number): Promise<AxiosResponse<Product, any>> {
            return Promise.resolve({...axiosResponseObj, data: {...productFullInfo, id}});
        }
        api.checkout = async function(form: CheckoutFormData, cart: CartState): Promise<AxiosResponse<CheckoutResponse, any>> {
            return Promise.resolve({...axiosResponseObj, data: {id: 2}});
        }

        let cartProductsMock: CartState = {
            1: {
                name: 'cool product',
                price: 542,
                count: 4,
            },
            2: {
                name: 'very cool product',
                price: 859,
                count: 1,
            },
        };
        cart.getState = function(): CartState {
            return cartProductsMock;
        }
        cart.setState = function(cart: CartState) {
            cartProductsMock = {...cartProductsMock, ...cart};
        }
    });
    
    it("Названия товаров на странице содержат названия товаров, полученных с сервера", async () => {
        const store = initStore(api, cart);
        
        const app = (
            <BrowserRouter basename={basename}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </BrowserRouter>
        );
        
        const { findAllByTestId, getByTestId } = render(app);
        const catalogLink = getByTestId("catalog-link");
        fireEvent.click(catalogLink);

        const productsFromApi = await api.getProducts().then(response => response.data);
        const productsOnPage = await findAllByTestId(/([0-9]+)/).then(products => products.map(prod => prod.querySelector('h5')?.textContent));
        
        for (let i = 0; i < productsOnPage.length; i++) {
            const productOnPageTitle = productsOnPage[i];
            const productsFromApiTitles = productsFromApi.map(item => item.name);
            expect(productsFromApiTitles).toContain(productOnPageTitle);
        }
    });

    it("Каждый товар в каталоге содержит название, цену и ссылку на страницу товара", async () => {
        const store = initStore(api, cart);
        
        const app = (
            <BrowserRouter basename={basename}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </BrowserRouter>
        );
        
        const { findAllByTestId, getByTestId } = render(app);
        const catalogLink = getByTestId("catalog-link");
        fireEvent.click(catalogLink);
        const productsOnPage = await findAllByTestId(/([0-9]+)/);
        
        for (let i = 0; i < productsOnPage.length; i++) {
            const singleProduct = productsOnPage[i];
            const title = singleProduct.querySelector('.card-title');
            const price = singleProduct.querySelector('.card-text');
            const link = singleProduct.querySelector('.card-link');

            expect(title).toBeTruthy();
            expect(price).toBeTruthy();
            expect(link).toBeTruthy();
            expect(link?.getAttribute('href')).toBeTruthy();
        }
    });

    it('Страница отдельного товара содержит его название, описание, цену, цвет, материал, кнопку "добавить в корзину"', async () => {
        const store = initStore(api, cart);
        
        const app = (
            <BrowserRouter basename={basename}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </BrowserRouter>
        );
        
        const { findByTestId, findAllByTestId, getByTestId } = render(app);
        const catalogLink = getByTestId("catalog-link");
        fireEvent.click(catalogLink);
        const productsOnPage = await findAllByTestId(/([0-9]+)/);

        if (productsOnPage.length > 0) {
            const productLink = productsOnPage[productsOnPage.length - 1].querySelector('.card-link');
            if (productLink) {
                fireEvent.click(productLink);
                const productFullPage = await findByTestId("product-detail");
                const title = productFullPage.querySelector('.ProductDetails-Name');
                const description = productFullPage.querySelector('.ProductDetails-Description');
                const price = productFullPage.querySelector('.ProductDetails-Price');
                const addToCartLink = productFullPage.querySelector('.ProductDetails-AddToCart');
                const color = productFullPage.querySelector('.ProductDetails-Color');
                const material = productFullPage.querySelector('.ProductDetails-Material');

                expect(title).toBeTruthy();
                expect(description).toBeTruthy();
                expect(price).toBeTruthy();
                expect(addToCartLink).toBeTruthy();
                expect(color).toBeTruthy();
                expect(material).toBeTruthy();
            }
        }
        
        for (let i = 0; i < productsOnPage.length; i++) {
            const singleProduct = productsOnPage[i];
            const title = singleProduct.querySelector('.card-title');
            const price = singleProduct.querySelector('.card-text');
            const link = singleProduct.querySelector('.card-link');

            expect(title).toBeTruthy();
            expect(price).toBeTruthy();
            expect(link).toBeTruthy();
            expect(link?.getAttribute('href')).toBeTruthy();
        }
    });
});