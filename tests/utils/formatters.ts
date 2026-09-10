export function normalizeMoneyText(text: string | null): string {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
}

export function normalizeSpanishNumber(text: string): string {
    // Remove all dots (thousands separator) and replace comma with dot (decimal separator)
    return text.replace(/\./g, '').replace(/,/g, '.');
}

export function extractNumber(text: string | null): number | null {
    if (!text) return null;
    // Keep only numbers, minus sign, dots, and commas
    const clean = text.replace(/[^0-9.,-]/g, '');
    if (!clean) return null;
    
    // If there is a comma, we assume Spanish formatting: thousands separator is dot, decimal is comma
    let standardNumStr = clean;
    if (clean.includes(',')) {
        standardNumStr = normalizeSpanishNumber(clean);
    } else {
        // If there's no comma but there are dots, we need to be careful if it is e.g. "1.234" (Spanish 1234)
        // or "1.23" (English 1.23). 
        // If a single dot is present and followed by 3 digits, and it's a large value, it might be thousands.
        // But usually, standard numbers from API are English formatted, whereas UI is Spanish formatted.
        // If the clean string has dots but no commas, we can assume standard float if it's like 12.34
        // or Spanish thousands if it's like 1.234. Let's keep it simple:
        // Normally, UI in Spanish renders cents. So if there's no comma, it could be a whole number (e.g. 10.000).
        // Let's check: if there is a dot, and it has digits after it.
        // Actually, if UI uses "." for thousands and "," for decimals, any UI currency text will have a comma for decimals.
        // So the clean.includes(',') check is very reliable for UI text.
    }
    
    const num = parseFloat(standardNumStr);
    return isNaN(num) ? null : num;
}

export function formatNumberForComparison(value: number): string {
    return value.toFixed(2);
}
