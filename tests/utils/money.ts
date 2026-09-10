import { Locator, expect } from '@playwright/test';

export function normalizeMoneyText(text: string | null): string {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
}

export async function getVisibleMoneyTexts(scope: Locator): Promise<string[]> {
    const texts = await scope.allInnerTexts();
    return texts.map(normalizeMoneyText).filter(t => t.length > 0);
}

export async function expectScopeToUseCurrency(scope: Locator, currencySymbol: string) {
    // Validamos que el texto visible del scope contenga el símbolo esperado
    await expect(scope).toContainText(currencySymbol, { ignoreCase: true });
}

export async function expectScopeNotToContainCurrencies(scope: Locator, forbiddenCurrencies: string[]) {
    // Validamos que el texto visible del scope NO contenga las monedas prohibidas
    const textContent = await scope.innerText();
    for (const currency of forbiddenCurrencies) {
        // Usamos expect crudo porque toNotContainText a veces hace retries indeseados si el texto cambia
        expect(textContent.toLowerCase()).not.toContain(currency.toLowerCase());
    }
}
