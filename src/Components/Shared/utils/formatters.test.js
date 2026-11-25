import { escapeHtml, formatCurrency, formatNumber } from './formatters';

describe('Shared formatters utilities', () => {
    test('formatCurrency formats numbers as EUR currency', () => {
        expect(formatCurrency(1234.5)).toBe('€1,234.50');
        expect(formatCurrency(40, { maximumFractionDigits: 0 })).toBe('€40');
        expect(formatCurrency(null)).toBe('€0.00');
        expect(formatCurrency('not-a-number')).toBe('€0.00');
    });

    test('formatNumber formats numbers with thousands separators', () => {
        expect(formatNumber(12345)).toBe('12,345');
        expect(formatNumber(undefined)).toBe('0');
    });

    test('escapeHtml neutralizes HTML special characters for safe print rendering', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        );
        expect(escapeHtml("O'Reilly & Co")).toBe('O&#39;Reilly &amp; Co');
        expect(escapeHtml(null)).toBe('');
    });
});
