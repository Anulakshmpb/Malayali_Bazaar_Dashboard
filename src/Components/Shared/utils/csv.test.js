import { escapeCsvCell } from './csv';

describe('Shared CSV utilities', () => {
  test('escapeCsvCell neutralizes spreadsheet formula injection', () => {
    expect(escapeCsvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"');
    expect(escapeCsvCell('+491701234567')).toBe('"\'+491701234567"');
    expect(escapeCsvCell('@cmd')).toBe('"\'@cmd"');
  });

  test('escapeCsvCell escapes internal double quotes and handles nullish values', () => {
    expect(escapeCsvCell('Rice "5kg"')).toBe('"Rice ""5kg"""');
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
  });
});
