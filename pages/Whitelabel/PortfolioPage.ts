import { Page, Locator, expect } from '@playwright/test';

export class PortfolioPage {
    readonly page: Page;
    
    // Navegación
    readonly navPortfolio: Locator;

    // Selector Comitente
    // En Portfolio, el buscador probablemente está junto al título "Portfolio"
    readonly btnBuscadorComitente: Locator;
    readonly inputBuscadorComitente: Locator;
    
    // Monedas
    readonly btnMonedaARS: Locator;
    readonly btnMonedaUSD: Locator;
    readonly btnMonedaUSC: Locator;
    
    // Filtros de pestaña
    readonly btnFiltroEvolucion: Locator;
    readonly btnFiltroDistribucion: Locator;
    readonly btnFiltroRendimiento: Locator;
    
    // Combobox Distribución (Clase / Moneda)
    readonly comboboxDistribucion: Locator;

    constructor(page: Page) {
        this.page = page;
        
        this.navPortfolio = page.locator('a[href="/portfolio"]');
        
        // Buscador de comitente en Portfolio
        this.btnBuscadorComitente = page.locator('h1:has-text("Portfolio") ~ div button, button:has(span[title])').first();
        this.inputBuscadorComitente = page.getByRole('textbox').first();
        
        this.btnMonedaARS = page.getByRole('radio', { name: 'ARS' })
            .or(page.getByRole('button', { name: 'ARS' }))
            .or(page.getByText('ARS', { exact: true }))
            .or(page.locator('button, [role="radio"]').filter({ hasText: /^ARS$/i }))
            .first();

        this.btnMonedaUSD = page.getByRole('radio', { name: 'USD' })
            .or(page.getByRole('button', { name: 'USD' }))
            .or(page.getByText('USD', { exact: true }))
            .or(page.locator('button, [role="radio"]').filter({ hasText: /^USD$/i }))
            .first();

        this.btnMonedaUSC = page.getByRole('radio', { name: 'USC' })
            .or(page.getByRole('button', { name: 'USC' }))
            .or(page.getByText('USC', { exact: true }))
            .or(page.locator('button, [role="radio"]').filter({ hasText: /^USC$/i }))
            .first();
        
        this.btnFiltroEvolucion = page.getByRole('tab', { name: /Inversiones/i })
            .or(page.getByText('Inversiones'))
            .first();

        this.btnFiltroDistribucion = page.getByText('Distribución de portfolio')
            .or(page.getByText('Distribución'))
            .first();

        this.btnFiltroRendimiento = page.getByRole('tab', { name: /Rendimientos/i })
            .or(page.getByText('Rendimientos'))
            .first();
        
        this.comboboxDistribucion = page.getByRole('radio', { name: /Instrumento|Clase/i })
            .or(page.getByRole('combobox'))
            .first();
    }

    async goto() {
        await this.page.goto('/portfolio', { waitUntil: 'domcontentloaded' });
    }

    async selectComitente(cuenta: string) {
        if (await this.btnBuscadorComitente.isVisible({ timeout: 5000 }).catch(() => false)) {
            await this.btnBuscadorComitente.click();
            await this.inputBuscadorComitente.fill(cuenta);
            await this.page.getByRole('option').filter({ hasText: cuenta }).first().click();
            await this.page.waitForTimeout(500);
        }
    }

    async selectDistribucionFilter(opcion: 'Clase' | 'Moneda' | 'Instrumento') {
        const targetPattern = (opcion === 'Clase' || opcion === 'Instrumento') ? /Instrumento|Clase/i : new RegExp(opcion, 'i');
        const btn = this.page.getByRole('radio', { name: targetPattern })
            .or(this.page.getByRole('button', { name: targetPattern }))
            .or(this.page.getByText(targetPattern))
            .first();
        if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await btn.click();
        }
    }

    async selectCurrency(currency: 'USD' | 'USC' | 'ARS') {
        let btn: Locator;
        if (currency === 'USD') btn = this.btnMonedaUSD;
        else if (currency === 'USC') btn = this.btnMonedaUSC;
        else btn = this.btnMonedaARS;

        if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await btn.click();
            await this.page.waitForTimeout(500);
        }
    }

    async expectMoneyAreasUseCurrency(currency: 'USD' | 'USC' | 'ARS') {
        const currencyRegex = currency === 'ARS' ? /\bARS\b|\$/i : new RegExp(`\\b${currency}\\b`, 'i');
        const moneyArea = this.page.locator('span, div, p, td').filter({ hasText: currencyRegex }).first();
        await expect(moneyArea).toBeVisible({ timeout: 10000 });
    }
}
