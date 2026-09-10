import * as fs from 'fs';
import { expect } from '@playwright/test';

export class PDFManager {
    /**
     * Extracts all text from a PDF file.
     * @param filePath Absolute or relative path to the PDF file.
     * @returns The extracted text as a string.
     */
    static async extractText(filePath: string): Promise<string> {
        if (!fs.existsSync(filePath)) {
            throw new Error(`PDF file not found at path: ${filePath}`);
        }
        const dataBuffer = fs.readFileSync(filePath);
        
        // Use pdf-parse v2 API
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: dataBuffer });
        try {
            const result = await parser.getText();
            return result.text;
        } finally {
            await parser.destroy();
        }
    }

    /**
     * Asserts that the PDF contains the specified texts.
     * @param filePath Path to the PDF file.
     * @param expectedTexts Array of strings that must be present in the PDF.
     */
    static async assertContains(filePath: string, expectedTexts: string[]): Promise<void> {
        const text = await this.extractText(filePath);
        
        for (const expected of expectedTexts) {
            expect(text.normalize('NFC'), `Expected PDF at ${filePath} to contain "${expected}"`).toContain(expected.normalize('NFC'));
        }
    }

    /**
     * Asserts that the PDF DOES NOT contain the specified texts.
     * @param filePath Path to the PDF file.
     * @param unexpectedTexts Array of strings that must NOT be present in the PDF.
     */
    static async assertNotContains(filePath: string, unexpectedTexts: string[]): Promise<void> {
        const text = await this.extractText(filePath);
        
        for (const unexpected of unexpectedTexts) {
            expect(text.normalize('NFC'), `Expected PDF at ${filePath} NOT to contain "${unexpected}"`).not.toContain(unexpected.normalize('NFC'));
        }
    }
}
