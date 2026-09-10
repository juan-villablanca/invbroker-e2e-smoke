import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../../../pages/Whitelabel/LoginPage';

const clientes = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../data/clientes.json'), 'utf-8'));

setup('Inicio de sesión @synthetic', async ({ page, browser }) => {
    const sessionPath = path.join(process.cwd(), clientes.whitelabel.storageState);
    let sessionValid = false;

    if (fs.existsSync(sessionPath)) {
        console.log('[AUTH] Validando sesión cacheada de Whitelabel en el servidor...');
        const tempContext = await browser.newContext({ storageState: sessionPath });
        const tempPage = await tempContext.newPage();
        
        try {
            // Navegar a la Home y dar tiempo a que React procese la autenticación
            await tempPage.goto(clientes.whitelabel.baseUrl, { timeout: 15000 });
            await tempPage.waitForTimeout(2500);
            
            const currentUrl = tempPage.url();
            const isLogin = currentUrl.includes('/login');
            const dashboardHeading = tempPage.getByRole('heading', { name: 'Dashboard' });
            const isDashboardVisible = await dashboardHeading.isVisible();

            if (!isLogin && isDashboardVisible) {
                sessionValid = true;
            }
        } catch (error: any) {
            console.log('[AUTH] La sesión cacheada no es válida o falló la verificación.');
        } finally {
            await tempContext.close();
        }

        if (sessionValid) {
            console.log('✅ [AUTH] Cached Whitelabel session is valid. Skipping login.');
            return;
        } else {
            console.log('♻️ [AUTH] Cached Whitelabel session expired. Performing fresh login.');
            try {
                fs.unlinkSync(sessionPath);
            } catch (err) {
                // Silenciar error si el archivo no se pudo borrar
            }
        }
    } else {
        console.log('[AUTH] No existe sesión cacheada. Iniciando login fresco.');
    }

    const loginPage = new LoginPage(page);
    await page.goto(clientes.whitelabel.baseUrl);
    await loginPage.login(clientes.whitelabel.user, clientes.whitelabel.pass);
    
    // Esperamos a que cargue el home/dashboard sin usar networkidle
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ state: 'visible', timeout: 30000 });
    
    // Guardamos el estado de autenticación
    await page.context().storageState({ path: sessionPath });
});
