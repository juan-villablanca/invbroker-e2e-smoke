import { test, expect } from '../../../../fixtures/base';
import { HomePage } from '../../../../../pages/Whitelabel/HomePage';
import { expectResponseOk } from '../../../../utils/api-assertions';
import { extractNumber } from '../../../../utils/formatters';

test.describe('Home Page - Filtro de Monedas @home @regression @synthetic', () => {
    let consolidatedData: any[] = [];

    test.beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        
        let capturedResponse: any = null;
        const responseListener = (res: any) => {
            if (res.url().includes('/v1_0/holdings/consolidated') && (res.ok() || res.status() === 304)) {
                capturedResponse = res;
            }
        };
        page.on('response', responseListener);

        await homePage.goto();
        await homePage.expectLoaded();

        // Si capturó la respuesta de red, la usamos
        if (capturedResponse && capturedResponse.status() !== 304) {
            try {
                consolidatedData = await capturedResponse.json();
            } catch (e) {
                // Ignore parse errors
            }
        }

        // Si vino en 304 o no disparó request por cache, consultamos el endpoint directamente con el contexto autenticado
        if (!consolidatedData || consolidatedData.length === 0) {
            try {
                const apiRes = await page.request.get('/v1_0/holdings/consolidated');
                if (apiRes.ok()) {
                    consolidatedData = await apiRes.json();
                }
            } catch (e) {
                console.log('No se pudo obtener consolidatedData de respaldo:', e);
            }
        }

        page.off('response', responseListener);

        // Ensure balances are visible so we can read the text
        await homePage.ensureBalancesVisible();
    });

    function getExpectedValuedHoldings(currency: 'ARS' | 'USD' | 'USC'): number {
        const item = consolidatedData.find(d => d.currency === currency);
        if (!item) {
            throw new Error(`Moneda ${currency} no encontrada en los datos consolidados de la API`);
        }
        const num = parseFloat(item.total_valued_holdings);
        if (isNaN(num)) {
            throw new Error(`Monto inválido para moneda ${currency}: ${item.total_valued_holdings}`);
        }
        return num;
    }

    test('al seleccionar USD, la home muestra valores monetarios en USD', async ({ page }) => {
        const homePage = new HomePage(page);
        
        // Action
        await homePage.selectCurrency('USD');
        
        // Assertion 1: Botón seleccionado
        await homePage.expectCurrencySelected('USD');
        
        // Assertion 2: Zonas monetarias reales reflejan moneda (usando fallback container por ahora)
        await homePage.expectMoneyAreasUseCurrency('USD');

        // Assertion 3: Consistencia profunda API vs UI
        const uiText = await homePage.saldoText.textContent();
        const uiNumber = extractNumber(uiText);
        const expectedNumber = getExpectedValuedHoldings('USD');

        console.log(`[CURRENCY CONSISTENCY] USD - UI: ${uiNumber}, API: ${expectedNumber}`);
        expect(uiNumber).not.toBeNull();
        expect(uiNumber).toBeCloseTo(expectedNumber, 2);
    });

    test('al seleccionar USC, la home muestra valores monetarios en USC', async ({ page }) => {
        const homePage = new HomePage(page);
        
        // Action
        await homePage.selectCurrency('USC');
        
        // Assertion 1: Botón seleccionado
        await homePage.expectCurrencySelected('USC');
        
        // Assertion 2: Zonas monetarias reales reflejan moneda
        await homePage.expectMoneyAreasUseCurrency('USC');

        // Assertion 3: Consistencia profunda API vs UI
        const uiText = await homePage.saldoText.textContent();
        const uiNumber = extractNumber(uiText);
        const expectedNumber = getExpectedValuedHoldings('USC');

        console.log(`[CURRENCY CONSISTENCY] USC - UI: ${uiNumber}, API: ${expectedNumber}`);
        expect(uiNumber).not.toBeNull();
        expect(uiNumber).toBeCloseTo(expectedNumber, 2);
    });

    test('al seleccionar ARS, la home muestra valores monetarios en ARS', async ({ page }) => {
        const homePage = new HomePage(page);
        
        // Action
        await homePage.selectCurrency('ARS');
        
        // Assertion 1: Botón seleccionado
        await homePage.expectCurrencySelected('ARS');
        
        // Assertion 2: Zonas monetarias reales reflejan moneda
        await homePage.expectMoneyAreasUseCurrency('ARS');

        // Assertion 3: Consistencia profunda API vs UI
        const uiText = await homePage.saldoText.textContent();
        const uiNumber = extractNumber(uiText);
        const expectedNumber = getExpectedValuedHoldings('ARS');

        console.log(`[CURRENCY CONSISTENCY] ARS - UI: ${uiNumber}, API: ${expectedNumber}`);
        expect(uiNumber).not.toBeNull();
        expect(uiNumber).toBeCloseTo(expectedNumber, 2);
    });

});
