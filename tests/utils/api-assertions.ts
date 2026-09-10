import { expect, Response } from '@playwright/test';
import { extractNumber } from './formatters';

export async function expectResponseOk(response: Response) {
    expect(response.status()).toBe(200);
}

export function expectJsonHasKeys(json: any, keys: string[]) {
    expect(json).toBeDefined();
    for (const key of keys) {
        expect(json).toHaveProperty(key);
    }
}

export function findNumericField(json: any, possibleKeys: string[]): number | null {
    if (!json || typeof json !== 'object') return null;
    for (const key of possibleKeys) {
        if (key in json) {
            const val = json[key];
            const num = parseFloat(val);
            if (!isNaN(num)) return num;
        }
    }
    return null;
}

export function normalizeNumberFromApi(value: any): number | null {
    if (value === undefined || value === null) return null;
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? null : num;
}

export function normalizeNumberFromUi(text: string | null): number | null {
    return extractNumber(text);
}
