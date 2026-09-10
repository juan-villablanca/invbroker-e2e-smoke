import { Page, Locator, expect } from '@playwright/test';
import { expectScopeToUseCurrency, expectScopeNotToContainCurrencies } from '../../tests/utils/money';
export class HomePage {
    readonly page: Page;
    
    // Locators Generales
    readonly btnOcultarSaldo: Locator;
    readonly saldoText: Locator;
    readonly btnMonedaARS: Locator;
    readonly btnMonedaUSD: Locator;
    readonly btnMonedaUSC: Locator;
    
    // KPIs
    readonly kpiTotalComitentes: Locator;
    readonly kpiComitentesConSaldo: Locator;
    readonly kpiComitentesActivos: Locator;
    readonly linkNovedades: Locator;
    
    // Buscador
    readonly btnBuscadorComitente: Locator;
    readonly inputBuscadorComitente: Locator;
    
    // Filtros Gráficos Globales
    readonly btnMenoresSaldos: Locator;
    readonly btnMayoresSaldos: Locator;
    readonly btnClase: Locator;
    readonly btnMoneda: Locator;

    // Filtros Vista Comitente
    readonly btnTopPorcentaje: Locator;
    readonly btnTopValorMonetario: Locator;
    readonly btnPlazoCI: Locator;
    readonly btnPlazo24hs: Locator;
    readonly btnPlazoFuturo: Locator;

    // TODO: Falta data-testid en la UI para limitar las aserciones de dinero.
    // Scopes monetarios recomendados:
    // data-testid="balance-summary"
    // data-testid="consolidated-holdings"
    // data-testid="portfolio-table"
    // data-testid="client-view-holdings"
    readonly monetaryScope: Locator;
    readonly movementsTable: Locator;

    constructor(page: Page) {
        this.page = page;
        
        // Buscamos el botón por su aria-label (puede estar como Ocultar o Mostrar dependiendo del estado previo guardado)
        this.btnOcultarSaldo = page.getByRole('button', { name: /Ocultar valor|Mostrar valor/i });
        // Buscamos el elemento de texto gigante (el span)
        this.saldoText = page.locator('span.text-xl.sm\\:text-2xl.font-semibold');
        
        // Monedas (son Radio Buttons de Radix UI)
        this.btnMonedaARS = page.getByRole('radio', { name: 'ARS', exact: true });
        this.btnMonedaUSD = page.getByRole('radio', { name: 'USD', exact: true });
        this.btnMonedaUSC = page.getByRole('radio', { name: 'USC', exact: true });

        // --- KPIs ---
        this.kpiTotalComitentes = page.getByText('Total de comitentes', { exact: true });
        this.kpiComitentesConSaldo = page.getByText('Comitentes con saldo', { exact: true });
        this.kpiComitentesActivos = page.getByText('Comitentes activos', { exact: true });
        // Hay muchos "Novedades", agarramos el que es un enlace del menú/navegación o con href /research
        this.linkNovedades = page.locator('a[href="/research"]');

        // --- Buscador ---
        // El botón del buscador puede no tener rol combobox y cambia su texto/título cuando se selecciona un comitente.
        // Lo localizamos de forma robusta como el primer botón en el contenedor hermano del título "Dashboard".
        this.btnBuscadorComitente = page.locator('h1:has-text("Dashboard") ~ div button').first();
        // El input aparece dentro del menú desplegable, usamos textbox genérico por las mismas razones que en Mis Clientes
        this.inputBuscadorComitente = page.getByRole('textbox').first();

        // --- Filtros Gráficos ---
        this.btnMenoresSaldos = page.getByRole('radio', { name: /Menores saldos/i });
        this.btnMayoresSaldos = page.getByRole('radio', { name: /Mayores saldos/i });
        this.btnClase = page.getByRole('radio', { name: 'Clase', exact: true });
        this.btnMoneda = page.getByRole('radio', { name: 'Moneda', exact: true });

        // --- Vista Comitente ---
        this.btnTopPorcentaje = page.getByRole('radio', { name: 'Porcentaje' });
        this.btnTopValorMonetario = page.getByRole('radio', { name: 'Valor monetario' });
        this.btnPlazoCI = page.getByRole('radio', { name: 'CI' });
        this.btnPlazo24hs = page.getByRole('radio', { name: '24hs' });
        this.btnPlazoFuturo = page.getByRole('radio', { name: 'Futuro' });

        // Scopes monetarios (evitando el header para no incluir los botones de moneda que generan falsos positivos)
        this.monetaryScope = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Tenencia consolidada' }) }).first();
        this.movementsTable = page.getByRole('table').first();
    }

    // --- ACCIONES DE NEGOCIO ---

    async goto() {
        await this.page.goto('/');
    }

    async expectLoaded() {
        await expect(this.page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 30000 });
    }

    async showBalances() {
        const isHidden = await this.saldoText.textContent();
        if (isHidden && isHidden.includes('****')) {
            await this.btnOcultarSaldo.click();
            await expect(this.saldoText).not.toContainText('****');
        }
    }

    async hideBalances() {
        const isVisible = await this.saldoText.textContent();
        if (isVisible && !isVisible.includes('****')) {
            await this.btnOcultarSaldo.click();
            await expect(this.saldoText).toContainText('****');
        }
    }

    async ensureBalancesVisible() {
        await this.showBalances();
    }

    async expectBalancesHidden() {
        await expect(this.saldoText).toContainText('****');
    }

    async expectBalancesVisible() {
        await expect(this.saldoText).not.toContainText('****');
    }

    async selectCurrency(currency: 'USD' | 'USC' | 'ARS') {
        if (currency === 'USD') await this.btnMonedaUSD.click();
        if (currency === 'USC') await this.btnMonedaUSC.click();
        if (currency === 'ARS') await this.btnMonedaARS.click();
    }

    async expectCurrencySelected(currency: 'USD' | 'USC' | 'ARS') {
        if (currency === 'USD') await expect(this.btnMonedaUSD).toHaveAttribute('data-state', 'on');
        if (currency === 'USC') await expect(this.btnMonedaUSC).toHaveAttribute('data-state', 'on');
        if (currency === 'ARS') await expect(this.btnMonedaARS).toHaveAttribute('data-state', 'on');
    }

    async expectMoneyAreasUseCurrency(currency: 'USD' | 'USC' | 'ARS') {
        // Validamos siempre sobre el saldo consolidado principal (Tenencia consolidada)
        // Se descarta "Últimos movimientos" porque los registros conservan sus monedas originales.
        if (currency === 'ARS') {
            await expect(this.saldoText).toContainText(/\bARS\b|\$/i);
        } else if (currency === 'USD') {
            await expect(this.saldoText).toContainText(/\bUSD\b/i);
        } else if (currency === 'USC') {
            await expect(this.saldoText).toContainText(/\bUSC\b/i);
        }
    }

    async getKpiValue(label: string): Promise<string> {
        const card = this.page.locator('div[role="button"]').filter({ hasText: label }).first();
        const valueLocator = card.locator('p.font-semibold');
        const text = await valueLocator.textContent();
        return text ? text.trim() : '';
    }

    async expectClientSpecificFiltersVisible() {
        await expect(this.btnTopPorcentaje).toBeVisible();
        await expect(this.btnPlazo24hs).toBeVisible();
    }

    async selectSettlementTerm(term: 'CI' | '24hs' | 'Futuro') {
        if (term === 'CI') await this.btnPlazoCI.click();
        if (term === '24hs') await this.btnPlazo24hs.click();
        if (term === 'Futuro') await this.btnPlazoFuturo.click();
    }

    async selectMetric(metric: 'Porcentaje' | 'Valor monetario') {
        if (metric === 'Porcentaje') await this.btnTopPorcentaje.click();
        if (metric === 'Valor monetario') await this.btnTopValorMonetario.click();
    }

    async selectGlobalChartFilter(filter: 'Menores saldos' | 'Clase' | 'Moneda') {
        if (filter === 'Menores saldos') await this.btnMenoresSaldos.click();
        if (filter === 'Clase') await this.btnClase.click();
        if (filter === 'Moneda') await this.btnMoneda.click();
    }

    async alternarPrivacidadSaldo() {
        await this.btnOcultarSaldo.click();
        await this.page.waitForTimeout(500); // Pequeña espera visual
    }

    async buscarYSeleccionarComitente(query: string) {
        // Esperamos a que el botón del buscador esté visible antes de hacer click
        await this.btnBuscadorComitente.waitFor({ state: 'visible', timeout: 10000 });
        await this.btnBuscadorComitente.click();
        
        // Esperamos que el input de búsqueda aparezca en el DOM
        await this.inputBuscadorComitente.waitFor({ state: 'visible', timeout: 5000 });
        await this.inputBuscadorComitente.fill(query);
        
        // Esperamos que aparezca la opción y la clickeamos
        const option = this.page.getByRole('option', { name: query }).first();
        await option.waitFor({ state: 'visible', timeout: 5000 });
        await option.click();
        
        // Pequeña espera para que la UI se asiente
        await this.page.waitForTimeout(500); 
    }
}
