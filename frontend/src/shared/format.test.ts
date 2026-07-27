import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('formatea centavos COP a moneda sin decimales', () => {
    const result = formatCurrency(45000000);
    expect(result).toContain('450.000');
  });

  it('formatea 0 correctamente', () => {
    expect(formatCurrency(0)).toContain('0');
  });
});
