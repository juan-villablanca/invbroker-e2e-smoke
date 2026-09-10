/**
 * Global Test Fixtures
 *
 * Extends Playwright's base `test` with global hooks:
 * 1. Strips cache headers on every request to prevent 304 Not Modified issues
 * 2. Takes a robust screenshot after each failed test
 *
 * Usage: Replace `import { test, expect } from '@playwright/test'`
 * with    `import { test, expect } from '../../fixtures/base'`
 */
import { test as base, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../../pages/Whitelabel/LoginPage';

/**
 * Waits for the page to be visually stable before taking a screenshot.
 */
export async function waitForPageStable(page: Page): Promise<void> {
    try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch {
        // Timeout acceptable — continue
    }

    const loadingSelectors = [
        '[class*="loading"]',
        '[class*="spinner"]',
        '[class*="skeleton"]',
        '[class*="loader"]',
        '[class*="spin"]',
        '[aria-busy="true"]',
        '[data-loading="true"]',
    ];

    for (const selector of loadingSelectors) {
        try {
            const el = page.locator(selector).first();
            const count = await el.count();
            if (count > 0) {
                await el.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
            }
        } catch {
            // Silently continue
        }
    }

    await page.waitForTimeout(500);
}

/**
 * Takes a screenshot after verifying the page is stable.
 */
export async function takeRobustScreenshot(page: Page, testInfo: any, name: string): Promise<void> {
    await waitForPageStable(page);
    try {
        const screenshotBuffer = await page.screenshot({ fullPage: false, timeout: 10000 });
        await testInfo.attach(name, { body: screenshotBuffer, contentType: 'image/png' });
    } catch (e: any) {
        console.warn(`⚠️ Failed to take screenshot "${name}":`, e.message);
    }
}

export const test = base.extend<{}>({
    page: async ({ page }, use, testInfo) => {
        // Strip cache headers globally to prevent 304 Not Modified breaking tests
        await page.route('**/*', async route => {
            const headers = route.request().headers();
            delete headers['if-none-match'];
            delete headers['if-modified-since'];
            await route.fallback({ headers });
        });

        // Interceptar goto para manejar auto-login si la sesión expira
        const originalGoto = page.goto.bind(page);
        page.goto = async (url: string, options?: any) => {
            const response = await originalGoto(url, options);
            
            // Wait for potential redirect to /login
            await page.waitForLoadState('networkidle').catch(() => {});
            
            if (page.url().includes('/login') && !url.includes('/login')) {
                console.log(`🔄 [Auto-Login] Sesión expirada al ir a ${url}. Re-autenticando silenciosamente...`);
                try {
                    const clientesPath = path.join(process.cwd(), 'data', 'clientes.json');
                    const clientes = JSON.parse(fs.readFileSync(clientesPath, 'utf-8'));
                    
                    const loginPage = new LoginPage(page);
                    await loginPage.login(clientes.whitelabel.user, clientes.whitelabel.pass);
                    
                    // Esperar a salir del login
                    await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 }).catch(() => {});
                    
                    console.log(`✅ [Auto-Login] Re-autenticación exitosa. Retomando navegación original...`);
                    // Volver a la URL original
                    return await originalGoto(url, options);
                } catch (e) {
                    console.error('❌ Error en Auto-Login silencioso:', e);
                }
            }
            
            return response;
        };

        await use(page);

        // Take screenshot on failure
        const isChatOps = !!process.env.SLACK_THREAD_TS;
        const testFailed = testInfo.status !== testInfo.expectedStatus;
        if (testFailed || isChatOps) {
            await takeRobustScreenshot(page, testInfo, 'screenshot-final');
        }

        // Close page context safely if open
        try {
            if (!page.isClosed()) {
                await page.close().catch(() => {});
            }
        } catch (e) {
            // Ignore teardown errors
        }
    },
});

export { expect };
