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
        const store = initStore(api, cart);

        api.getProducts = async function(): Promise<AxiosResponse<ProductShortInfo[], any>> {
            return Promise.resolve({...axiosResponseObj, data: productShortInfos});
        }

        api.getProductById = async function(id: number): Promise<AxiosResponse<Product, any>> {
            return Promise.resolve({...axiosResponseObj, data: {...productFullInfo, id}});
        }

        api.checkout = async function(form: CheckoutFormData, cart: CartState): Promise<AxiosResponse<CheckoutResponse, any>> {
            return Promise.resolve({...axiosResponseObj, data: {id: 2}});
        }
        
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

