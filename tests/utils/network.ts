import { Page, Response } from '@playwright/test';

export async function waitForSuccessfulResponse(page: Page, urlFragment: string, timeoutMs: number = 30000): Promise<Response> {
    return page.waitForResponse(response => 
        response.url().includes(urlFragment) && (response.status() >= 200 && response.status() < 400),
        { timeout: timeoutMs }
    );
}

export async function waitForEndpointContaining(page: Page, urlFragment: string, timeoutMs: number = 30000): Promise<Response> {
    return page.waitForResponse(response => response.url().includes(urlFragment), { timeout: timeoutMs });
}

export async function waitForClientSearchResponses(page: Page) {
    return Promise.all([
        waitForSuccessfulResponse(page, '/v1_0/holdings/accounts/investment-accounts'),
        waitForSuccessfulResponse(page, '/v1_0/holdings/portfolio/investment-account/total'),
        waitForSuccessfulResponse(page, '/v1_0/holdings/ppp/positions'),
        waitForEndpointContaining(page, '/holdings/graph'),
        waitForSuccessfulResponse(page, '/v2_0/holdings/intra/daily')
    ]);
}

export async function waitForHomeLoadResponses(page: Page) {
    return Promise.all([
        waitForSuccessfulResponse(page, '/v1_0/holdings/indicators'),
        waitForSuccessfulResponse(page, '/v2_0/holdings/graph'),
        waitForSuccessfulResponse(page, '/v1_0/holdings/consolidated'),
        waitForSuccessfulResponse(page, '/v1_0/holdings/currencies/total'),
        waitForSuccessfulResponse(page, '/v1_0/holdings/currencies')
    ]);
}
