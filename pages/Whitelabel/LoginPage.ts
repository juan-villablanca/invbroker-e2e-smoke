import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.locator('input[name="email"]');
        this.passwordInput = page.locator('input[name="password"]');
        this.loginButton = page.locator('button[type="submit"]');
    }

    async goto() {
        await this.page.goto('/login');
    }

    async login(user: string, pass: string) {
        await this.emailInput.fill(user);
        await this.passwordInput.fill(pass);
        // Esperar a que el botón se habilite (React necesita procesar los eventos del input)
        await expect(this.loginButton).toBeEnabled({ timeout: 10000 });
        await this.loginButton.click();
    }
}
