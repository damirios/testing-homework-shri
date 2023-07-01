import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { Application } from '../../src/client/Application';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { initStore } from '../../src/client/store';

import "@testing-library/jest-dom";
import { CartState, CheckoutFormData, CheckoutResponse, Product, ProductShortInfo } from '../../src/common/types';
import { CartApi, ExampleApi } from '../../src/client/api';
import { AxiosResponse } from 'axios';
import { Cart } from '../../src/client/pages/Cart';
import { ProductDetails } from '../../src/client/components/ProductDetails';

function mockApiMethods(api: ExampleApi) {
    const axiosResponseObj = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
        request: {}
    };

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

    api.getProducts = async function(): Promise<AxiosResponse<ProductShortInfo[], any>> {
        return Promise.resolve({...axiosResponseObj, data: productShortInfos});
    }
    api.getProductById = async function(id: number): Promise<AxiosResponse<Product, any>> {
        return Promise.resolve({...axiosResponseObj, data: {...productFullInfo, id}});
    }
    api.checkout = async function(form: CheckoutFormData, cart: CartState): Promise<AxiosResponse<CheckoutResponse, any>> {
        return Promise.resolve({...axiosResponseObj, data: {id: 2}});
    }
}

function mockCartMethods(cart: CartApi) {
    let cartProductsMock: CartState = {};
    cart.getState = function(): CartState {
        return cartProductsMock;
    }
    cart.setState = function(cart: CartState) {
        cartProductsMock = {...cartProductsMock, ...cart};
    }
}

function mountApp(api: ExampleApi, cart: CartApi, basename: string): React.JSX.Element {
    mockApiMethods(api);
    mockCartMethods(cart);

    const store = initStore(api, cart);
    
    const app = (
        <BrowserRouter basename={basename}>
            <Provider store={store}>
                <Application />
            </Provider>
        </BrowserRouter>
    );

    return app;
}

function getDetailedProduct(id: number) {
    return {
        description: "Some nice description of a product",
        material: "porcelain",
        color: "white",
        id,
        name: `first product ${id + 1}`,
        price: 120 * (id + 1)
    };
}

describe('Наличие ссылок в шапке', () => {
    let header: HTMLElement;

    beforeEach(() => {
        const basename = '/hw/store';
        const api = new ExampleApi(basename);
        const cart = new CartApi();

        const app = mountApp(api, cart, basename);
        
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

        const app = mountApp(api, cart, basename);
        
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
    let app: React.JSX.Element;

    beforeEach(() => {        
        api = new ExampleApi(basename);
        cart = new CartApi();

        app = mountApp(api, cart, basename);
    });
    
    it("Названия товаров на странице содержат названия товаров, полученных с сервера", async () => {     
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
    });
});

describe("Взаимодействие с корзиной на странице товара", () => {   
    it('При нажатии на "добавить в корзину" товар добавляется в корзину - появляется уведомление на странице товара и в каталоге.', async () => {
        const basename = "/hw/store";
        const api = new ExampleApi(basename);
        const cart = new CartApi();

        const app = mountApp(api, cart, basename);
        const { findAllByTestId, findByTestId, queryByTestId } = render(app);
        const catalogLink = await findByTestId("catalog-link");

        fireEvent.click(catalogLink);
        const productDetailsLink = await findAllByTestId("product-details-link").then(productsLinks => productsLinks[0]);
        expect(queryByTestId("success-message")).not.toBeInTheDocument(); // сообщения нет в каталоге до нажатия кнопки

        fireEvent.click(productDetailsLink);
        
        const addToCartButton = await findByTestId("add-to-cart");
        expect(queryByTestId("success-message")).not.toBeInTheDocument(); // сообщения нет на странице товара до нажатия кнопки
        fireEvent.click(addToCartButton);
        expect(queryByTestId("success-message")).toBeInTheDocument(); // сообщение есть на странице товара после нажатия кнопки

        fireEvent.click(catalogLink);
        await findAllByTestId("product-details-link");
        expect(queryByTestId("success-message")).toBeInTheDocument(); // сообщение есть в каталоге после нажатия кнопки
    });

    it('Количество товара в корзине увеличивается на 1 при одном клике на "добавить в корзину".', async () => {
        const basename = "/hw/store";
        const api = new ExampleApi(basename);
        const cart = new CartApi();
        const productId = 1;
        
        mockApiMethods(api);
        mockCartMethods(cart);
        const store = initStore(api, cart);
        
        const cartComponent = <BrowserRouter basename={basename}>
            <Provider store={store}>
                <Cart />
            </Provider>
        </BrowserRouter>

        const productPageComponent = <BrowserRouter basename={basename}>
            <Provider store={store}>
                <ProductDetails product={getDetailedProduct(productId)} />
            </Provider>
        </BrowserRouter>

        const cartRender = render(cartComponent);
        const productRender = render(productPageComponent);

        const addToCartButton = await cartRender.findByTestId("add-to-cart");
        fireEvent.click(addToCartButton);

        await waitFor(() => {
            expect(productRender.queryByTestId(productId)).not.toBeNull();
        })
        const productInCart = productRender.queryByTestId(productId);
        let productAmount = productInCart?.querySelector(".Cart-Count")?.textContent;
        expect(productAmount).toBeDefined();
        
        fireEvent.click(addToCartButton);
        expect(productInCart?.querySelector(".Cart-Count")?.textContent).toBe("2");

        fireEvent.click(addToCartButton);
        fireEvent.click(addToCartButton);
        fireEvent.click(addToCartButton);
        expect(productInCart?.querySelector(".Cart-Count")?.textContent).toBe("5");
    });

    it("В шапке рядом со ссылкой должно отображаться кол-во уникальных товаров в корзине.", async () => {
        const basename = "/hw/store";
        const api = new ExampleApi(basename);
        const cart = new CartApi();
        const productIds = [0, 2, 3, 5, 1];
        
        mockApiMethods(api);
        mockCartMethods(cart);
        const store = initStore(api, cart);
        
        const app = (
            <BrowserRouter basename={basename}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </BrowserRouter>
        );
        const appRender = render(app);

        const productPageComponent = <BrowserRouter basename={basename}>
            <Provider store={store}>
                {productIds.map(id => <ProductDetails key={id} product={getDetailedProduct(id)} /> )}
            </Provider>
        </BrowserRouter>

        const productRender = render(productPageComponent);
        
        const addToCartButton = await productRender.findAllByTestId("add-to-cart");
        for (let i = 0; i < addToCartButton.length; i++) {
            const button = addToCartButton[i];
            if (i === 0) {
                expect(appRender.queryByTestId("cart-link-header")?.textContent).toBe("Cart");
            } else {
                expect(appRender.queryByTestId("cart-link-header")?.textContent).toBe("Cart (" + i.toString() + ")");
            }

            fireEvent.click(button);
            if (i === 2) { // добавляю 3 товара с одним с таким же id - влиять не должно
                fireEvent.click(button);
                fireEvent.click(button);
                fireEvent.click(button);
            }
        }
    
    });

    it("В корзине должны корректно отображаться все добавленные товары. Также корректная общая сумма товаров.", async () => {
        const basename = "/hw/store";
        const api = new ExampleApi(basename);
        const cart = new CartApi();
        const productsAmount = [
            {
                id: 0,
                amount: 1
            },
            {
                id: 2,
                amount: 3
            },
            {
                id: 3,
                amount: 1
            },
            {
                id: 5,
                amount: 2
            },
            {
                id: 1,
                amount: 4
            }
        ]
        
        mockApiMethods(api);
        mockCartMethods(cart);
        const store = initStore(api, cart);
        
        const cartComponent = <BrowserRouter basename={basename}>
            <Provider store={store}>
                <Cart />
            </Provider>
        </BrowserRouter>
        const cartRender = render(cartComponent);

        const productPageComponent = <BrowserRouter basename={basename}>
            <Provider store={store}>
                {productsAmount.map(product => <ProductDetails key={product.id} product={getDetailedProduct(product.id)} /> )}
            </Provider>
        </BrowserRouter>

        const productRender = render(productPageComponent);
        
        const addToCartButton = await productRender.findAllByTestId("add-to-cart");
        for (let i = 0; i < addToCartButton.length; i++) {
            const button = addToCartButton[i];
            for (let j = 0; j < productsAmount[i].amount; j++) {
                fireEvent.click(button);
            }
        }

        productsAmount.sort((a, b) => a.id - b.id); // в корзине отсортировано по возрастанию id, поэтому и тут так делаем
        const productsInCart = await cartRender.findAllByTestId(/([0-9]+)/);

        let totalSum = 0;
        for (let i = 0; i < productsInCart.length; i++) {
            const product = productsInCart[i];
            const {id, amount} = productsAmount[i];
            const price = getDetailedProduct(id).price;
            expect(product.querySelector(".Cart-Index")?.textContent).toBe((i + 1).toString());
            expect(product.querySelector(".Cart-Name")?.textContent).toBe(getDetailedProduct(id).name);
            expect(product.querySelector(".Cart-Price")?.textContent).toBe("$" + price);
            expect(product.querySelector(".Cart-Count")?.textContent).toBe(amount.toString());
            expect(product.querySelector(".Cart-Total")?.textContent).toBe("$" + (amount * price));

            totalSum += amount * price;
        }
    
        const totalSumInCart = await cartRender.findByTestId("cart-total-sum").then(price => price.textContent);
        expect(totalSumInCart?.slice(1, totalSumInCart.length)).toBe(totalSum.toString());
    });
});

describe("Функционал корзины", () => {
    it('В пустой корзине должна быть ссылка на каталог', async () => {
        const basename = "/hw/store";
        const api = new ExampleApi(basename);
        const cart = new CartApi();
        const store = initStore(api, cart);

        mockCartMethods(cart);
        mockApiMethods(api);
        
        const cartComponent = <BrowserRouter basename={basename}>
            <Provider store={store}>
                <Cart />
            </Provider>
        </BrowserRouter>

        const { findByTestId } = render(cartComponent);

        const href = await findByTestId("cart-link-to-catalog").then(link => link.getAttribute("href"));
        expect(href).toMatch(/.*\/hw\/store\/catalog/);
    });

    it('При наличии товара в корзине там же должна быть форма для чекаута.', async () => {
        const basename = "/hw/store";
        const api = new ExampleApi(basename);
        const cart = new CartApi();
        const productId = 1;
        
        mockApiMethods(api);
        mockCartMethods(cart);
        const store = initStore(api, cart);
        
        const cartComponent = <BrowserRouter basename={basename}>
            <Provider store={store}>
                <Cart />
            </Provider>
        </BrowserRouter>

        const productPageComponent = <BrowserRouter basename={basename}>
            <Provider store={store}>
                <ProductDetails product={getDetailedProduct(productId)} />
            </Provider>
        </BrowserRouter>

        const cartRender = render(cartComponent);
        const productRender = render(productPageComponent);

        await waitFor(() => {
            expect(cartRender.queryByTestId("checkout-form")).toBeNull();
        });

        const addToCartButton = await productRender.findByTestId("add-to-cart");
        fireEvent.click(addToCartButton);

        await waitFor(() => {
            expect(cartRender.queryByTestId("checkout-form")).not.toBeNull();
        });
    });
});

