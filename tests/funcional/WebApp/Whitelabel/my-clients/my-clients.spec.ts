import { test, expect, takeRobustScreenshot } from '../../../../fixtures/base';
import * as fs from 'fs';
import { waitForClientSearchResponses } from '../../../../utils/network';
import { PDFManager } from '../../../../utils/PDFManager';
import { PerformanceTracker } from '../../../../utils/PerformanceTracker';

test.describe('Mis Clientes @my-clients', () => {
  
  test.beforeEach(async ({ page }, testInfo) => {
    // Log all API responses dynamically for the MonitorLive
    page.on('requestfinished', async (req) => {
        if (req.url().includes('/api/') || req.resourceType() === 'fetch' || req.resourceType() === 'xhr') {
            try {
                const endpoint = new URL(req.url()).pathname;
                if (endpoint.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|json|woff|woff2)$/i) || endpoint.includes('/_next/')) return;
                
                const response = await req.response();
                if (!response) return;
                const status = response.status();
                const testName = testInfo.title;
                const timing = req.timing();
                const duration = timing.responseEnd > 0 ? Math.round(timing.responseEnd) : Math.round(timing.responseStart);
                console.log(`[API-VALIDATION]|${endpoint}|${status}|${testName}|${duration}ms`);
            } catch (e) {
                // Ignore URL parsing errors
            }
        }
    });

    // Navegar a Mis Clientes
    await page.goto('/my-clients');
  });

  test('Filtro por Cliente / Comitente y dropdown de estados', async ({ page }, testInfo) => {
    // Asegurar que el tab principal esté visible
    await expect(page.getByRole('tab', { name: 'Buscador de clientes' })).toBeVisible();

    // ── FILTRO POR COMITENTE ───────────────────────────────────────────────
    const searchInput = page.getByPlaceholder('Cliente o N° de comitente');
    await expect(searchInput).toBeVisible();
    
    const COMITENTE = '8196';
    const tracker = new PerformanceTracker('MIS CLIENTES');
    await tracker.measure('filtro-comitente', async () => {
        await searchInput.fill(COMITENTE);
        
        // CRÍTICO: presionar Enter para disparar la búsqueda
        await page.keyboard.press('Enter');
        
        // Esperar a que la tabla se actualice buscando el texto en vez de networkidle
        await page.waitForTimeout(500); // Pequeño margen para que inicie la petición
    });

    // Esperar a que la tabla tenga FILAS visibles
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    const tbody = table.locator('tbody tr:visible');
    
    // CRÍTICO: Esperar a que la primera fila contenga el comitente buscado.
    // Al ser una aserción de Playwright, reintenta automáticamente hasta que la tabla se filtre.
    await expect(tbody.first()).toContainText(COMITENTE, { timeout: 10000 });

    // VALIDACIÓN: Todos los resultados visibles deben pertenecer al comitente buscado
    const rowCount = await tbody.count();
    expect(rowCount).toBeGreaterThan(0);
    for (let i = 0; i < rowCount; i++) {
      const rowText = await tbody.nth(i).textContent();
      expect(rowText).toContain(COMITENTE);
    }

    // Screenshot ROBUSTO: solo cuando la tabla tiene datos y no hay spinners
    await takeRobustScreenshot(page, testInfo, 'evidencia-filtro-comitente');

    // ── LIMPIAR BUSCADOR ───────────────────────────────────────────────────
    await searchInput.clear();
    await page.keyboard.press('Enter');
    await expect(tbody.first()).toBeVisible({ timeout: 10000 });

    // ── FILTRO POR ESTADOS ─────────────────────────────────────────────────
    // Hay otro combobox para Exportar, asi que tomamos el primero
    const statusDropdown = page.getByRole('combobox').first();
    await expect(statusDropdown).toBeVisible();
    
    // Seleccionar 'Clientes activos'
    await statusDropdown.click();
    await page.getByRole('option', { name: 'Clientes activos' }).click();
    await expect(tbody.first()).toBeVisible({ timeout: 10000 });

    // Screenshot final con filtro de estado aplicado y sin spinners
    await takeRobustScreenshot(page, testInfo, 'evidencia-filtro-estado');
  });

  test('Configuración de columnas (Tuerca)', async ({ page }) => {
    // Boton de tuerca (tiene un svg mask especial)
    const settingsButton = page.locator('button').filter({ has: page.locator('svg mask') }).first();
    await expect(settingsButton).toBeVisible();
    
    // Asegurarnos de que el padre o él mismo reciba el click
    await settingsButton.click({ force: true });
    await page.waitForTimeout(1000); // Wait a bit for animation
    
    // Wait for the menu to appear, then grab the first valid option to toggle
    const menu = page.locator('[role="menu"], [role="dialog"], [data-radix-popper-content-wrapper]').filter({ hasText: 'Cliente' }).first();
    const checkbox = page.locator('[role="menuitemcheckbox"], [role="menuitem"], input[type="checkbox"]').first();
    
    await expect(checkbox).toBeVisible({ timeout: 5000 });
    
    // Contamos cuántas columnas visibles hay antes de hacer click
    const visibleColumnsBefore = await page.locator('table').first().locator('thead th:visible').count();
    
    // Deshabilitar la columna
    await checkbox.click(); 
    await page.keyboard.press('Escape'); // Close menu to trigger render si es necesario
    await page.waitForTimeout(1000); // Wait for table to update
    
    // Contamos cuántas columnas visibles hay después
    const visibleColumnsAfter = await page.locator('table').first().locator('thead th:visible').count();
    
    // La cantidad de columnas visibles debería haber cambiado (aumentado o disminuido)
    expect(visibleColumnsAfter).not.toEqual(visibleColumnsBefore);
  });

  test('Exportación a PDF (Clientes)', async ({ page }, testInfo) => {
    // Exportar
    await page.getByText('Exportar').first().click();
    
    const tracker = new PerformanceTracker('MIS CLIENTES');
    const download = await tracker.measure('pdf-export', async () => {
        const downloadPromise = page.waitForEvent('download');
        await page.getByText('Exportar a PDF').click();
        return await downloadPromise;
    });
    
    const path = await download.path();
    expect(path).toBeTruthy();
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // Validar lectura del PDF
    if (path) {
      const stats = fs.statSync(path);
      // Validar que el archivo no esté vacío (> 1KB)
      expect(stats.size).toBeGreaterThan(1000);
      
      // Validar que el PDF contenga textos esperados (cabeceras reales del reporte)
      await PDFManager.assertContains(path, ['Cliente', 'Portfolio total', 'Disponible ARS']);
      
      // Adjuntar el PDF al reporte
      await testInfo.attach('evidence.pdf', { path: path, contentType: 'application/pdf' });
    }
  });

  test('Tab "Buscador por instrumento"', async ({ page }) => {
    const tabBuscadorInstrumento = page.getByRole('tab', { name: 'Buscador por instrumento' });
    await tabBuscadorInstrumento.click();
    
    const tickerInput = page.getByPlaceholder('Ticker');
    await expect(tickerInput).toBeVisible();
    
    const tracker = new PerformanceTracker('MIS CLIENTES');
    await tracker.measure('buscar-instrumento-AL30', async () => {
        // Escribir AL30 y esperar respuesta
        await tickerInput.fill('AL30');
        await page.keyboard.press('Enter'); // Just in case

        // Esperar petición de backend para asegurarnos que la data llegó
        await page.waitForResponse(response => 
          response.url().includes('/holdings/find-instrument') && (response.ok() || response.status() === 304)
        );
    });
    
    await page.waitForTimeout(500); // Pequeño margen para renderizado del DOM
    
    // Validar que aparezca en la tabla
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    await expect(table.locator('tbody')).toContainText('AL30');
    
    // Validamos que el nombre de la columna Tenencia exista y contenga el valor esperado de alguna forma, 
    // pero basta con que la tabla renderice los items de la API.
    
    // Validar la exportación del tab Instrumento
    await page.getByText('Exportar').first().click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByText('Exportar a PDF').click();
    const download = await downloadPromise;
    
    const path = await download.path();
    expect(path).toBeTruthy();
    
    if (path) {
      const stats = fs.statSync(path);
      // Validar que el archivo no esté vacío (> 1KB)
      expect(stats.size).toBeGreaterThan(1000);
      
      // Validar contenido del PDF del buscador por instrumento (debería incluir la info de la API)
      await PDFManager.assertContains(path, ['5921 / BONO REP. ARGENTINA USD', 'Cantidad', 'Valuación']);
    }
  });

});
