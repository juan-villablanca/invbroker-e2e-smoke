import { test, expect } from '../../../../fixtures/base';
import { HomePage } from '../../../../../pages/Whitelabel/HomePage';
import { PortfolioPage } from '../../../../../pages/Whitelabel/PortfolioPage';

test.describe('Persistencia del filtro de comitente @home @portfolio @regression', () => {

    test('debería persistir el comitente al navegar de Home a Portfolio', async ({ page }) => {
        const homePage = new HomePage(page);
        const portfolioPage = new PortfolioPage(page);

        await homePage.goto();
        await homePage.expectLoaded();

        // Elegir un comitente en Home
        const comitenteTest = '445';
        await homePage.buscarYSeleccionarComitente(comitenteTest);

        // Validar que el botón muestre el comitente seleccionado
        await expect(homePage.btnBuscadorComitente).toContainText(comitenteTest);

        // Navegar a Portfolio
        await portfolioPage.navPortfolio.click();
        
        // Esperar que cargue Portfolio
        await expect(
            page.getByRole('heading', { name: 'Portfolio', exact: true })
                .or(page.locator('h1').filter({ hasText: 'Portfolio' }))
        ).toBeVisible({ timeout: 15000 });

        // Validar que el comitente sigue seleccionado en Portfolio
        await expect(portfolioPage.btnBuscadorComitente).toContainText(comitenteTest);
    });

    test('debería persistir el comitente al navegar de Portfolio a Home', async ({ page }) => {
        const homePage = new HomePage(page);
        const portfolioPage = new PortfolioPage(page);

        await portfolioPage.goto();
        
        // Esperar que cargue Portfolio
        await expect(
            page.getByRole('heading', { name: 'Portfolio', exact: true })
                .or(page.locator('h1').filter({ hasText: 'Portfolio' }))
        ).toBeVisible({ timeout: 15000 });

        // Elegir un comitente en Portfolio
        const comitenteTest = '445';
        await portfolioPage.selectComitente(comitenteTest);

        // Validar que el botón muestre el comitente seleccionado
        await expect(portfolioPage.btnBuscadorComitente).toContainText(comitenteTest);

        // Navegar a Home (click en logo o nav bar)
        await page.locator('a[href="/"]').first().click();
        await homePage.expectLoaded();

        // Validar que el comitente sigue seleccionado en Home
        await expect(homePage.btnBuscadorComitente).toContainText(comitenteTest);
    });
});
