import React from 'react';

import { render } from '@testing-library/react';

import { Application } from '../../src/client/Application';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { CartApi, ExampleApi } from '../../src/client/api';
import { initStore } from '../../src/client/store';

describe('Наличие ссылок в шапке', () => {
    it('Шапка содержит ссылки на страницы магазина и ссылку на корзину', () => {
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
        
        const linksRequired = ["/hw/store/catalog", "/hw/store/delivery", "/hw/store/contacts", "/hw/store/cart"];
        const { getByTestId } = render(app);
        const header = getByTestId("header");
        const links = header.querySelectorAll("a");
        const hrefs: string[] = [];
        links.forEach(link => hrefs.push(link.getAttribute("href") || ''));
        linksRequired.forEach(linkReq => {
            expect(hrefs).toContain(linkReq);
        });
    });
});
