import { test, expect } from '../../../../fixtures/base';
import { HomePage } from '../../../../../pages/Whitelabel/HomePage';
import { expectResponseOk, expectJsonHasKeys } from '../../../../utils/api-assertions';
import { extractNumber } from '../../../../utils/formatters';

test.describe('Home Page - Navegación desde KPIs @home @smoke', () => {
    let indicatorsData: any = null;

    test.beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        
        // Intercept indicators endpoint on load
        const indicatorsPromise = page.waitForResponse(response => 
            response.url().includes('/v1_0/holdings/indicators') && (response.ok() || response.status() === 304),
            { timeout: 30000 }
        ).catch(() => null);

        await homePage.goto();
        
        const response = await indicatorsPromise;
        if (response) {
            indicatorsData = await response.json().catch(() => null);
        }

        await homePage.expectLoaded();
    });

    test('validar consistencia de los números de KPIs entre API y UI @regression', async ({ page }) => {
        const homePage = new HomePage(page);
        
        expect(indicatorsData).not.toBeNull();
        expectJsonHasKeys(indicatorsData, ['TotalComitentes', 'ComitentesConSaldo', 'ComitentesActivas']);

        // Wait a brief moment to ensure rendering settled
        await page.waitForTimeout(2000);

        // Fetch KPI values from UI
        const uiTotal = await homePage.getKpiValue('Total de comitentes');
        const uiConSaldo = await homePage.getKpiValue('Comitentes con saldo');
        const uiActivos = await homePage.getKpiValue('Comitentes activos');

        console.log(`[KPI CONSISTENCY] API: Total=${indicatorsData.TotalComitentes}, ConSaldo=${indicatorsData.ComitentesConSaldo}, Activos=${indicatorsData.ComitentesActivas}`);
        console.log(`[KPI CONSISTENCY] UI:  Total=${uiTotal}, ConSaldo=${uiConSaldo}, Activos=${uiActivos}`);

        // Compare values
        expect(extractNumber(uiTotal)).toBe(indicatorsData.TotalComitentes);
        expect(extractNumber(uiConSaldo)).toBe(indicatorsData.ComitentesConSaldo);
        expect(extractNumber(uiActivos)).toBe(indicatorsData.ComitentesActivas);
    });

    test('novedades redirige a research', async ({ page }) => {
        const homePage = new HomePage(page);
        
        // Action: Click and wait for navigation in parallel
        await Promise.all([
            page.waitForURL(/.*research/),
            homePage.linkNovedades.click()
        ]);
        
        // Assertion
        await expect(page).toHaveURL(/.*research/);
    });

    test('total comitentes redirige a my-clients', async ({ page }) => {
        const homePage = new HomePage(page);
        
        await Promise.all([
            page.waitForURL(/.*my-clients/),
            homePage.kpiTotalComitentes.click()
        ]);
        
        await expect(page).toHaveURL(/.*my-clients/);
    });

    test('comitentes con saldo redirige con filtro cuentas_con_saldo=true @regression', async ({ page }) => {
        const homePage = new HomePage(page);
        
        await Promise.all([
            page.waitForURL(/.*my-clients\?cuentas_con_saldo=true/),
            homePage.kpiComitentesConSaldo.click()
        ]);
        
        await expect(page).toHaveURL(/.*my-clients\?cuentas_con_saldo=true/);
    });

    test('comitentes activos redirige con filtro cuentas_activas=true @regression', async ({ page }) => {
        const homePage = new HomePage(page);
        
        await Promise.all([
            page.waitForURL(/.*my-clients\?cuentas_activas=true/),
            homePage.kpiComitentesActivos.click()
        ]);
        
        await expect(page).toHaveURL(/.*my-clients\?cuentas_activas=true/);
    });

});
