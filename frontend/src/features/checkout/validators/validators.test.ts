import { detectCardBrand } from './cardBrand';
import { isValidCvc } from './cvc';
import { isValidExpiry } from './expiry';
import { isValidLuhn } from './luhn';
import { lastFour, maskCardNumber, maskExpiry } from './masks';

describe('isValidLuhn', () => {
  it.each([
    ['4242 4242 4242 4242', true], // Visa test
    ['5555 5555 5555 4444', true], // MasterCard test
    ['4111 1111 1111 1111', true],
    ['1234 5678 9012 3456', false], // Luhn incorrecto
    ['4242 4242 4242 4243', false],
  ])('%s -> %s', (input, expected) => {
    expect(isValidLuhn(input)).toBe(expected);
  });

  it('rechaza longitudes fuera de rango', () => {
    expect(isValidLuhn('4242')).toBe(false);
    expect(isValidLuhn('42424242424242424242')).toBe(false);
  });
});

describe('detectCardBrand', () => {
  it.each([
    ['4242424242424242', 'VISA'],
    ['4111111111111111', 'VISA'],
    ['5555555555554444', 'MASTERCARD'],
    ['5105105105105100', 'MASTERCARD'],
    ['2221000000000009', 'MASTERCARD'],
    ['2720999999999996', 'MASTERCARD'],
    ['6011000000000004', 'UNKNOWN'],
    ['', 'UNKNOWN'],
  ])('%s -> %s', (input, expected) => {
    expect(detectCardBrand(input)).toBe(expected);
  });
});

describe('isValidExpiry', () => {
  const now = new Date('2026-07-15T12:00:00Z');
  it('acepta un mes futuro', () => {
    expect(isValidExpiry('12/29', now)).toBe(true);
  });
  it('acepta el mes actual (aún no vencido)', () => {
    expect(isValidExpiry('07/26', now)).toBe(true);
  });
  it('rechaza un mes pasado', () => {
    expect(isValidExpiry('06/26', now)).toBe(false);
  });
  it('rechaza formato inválido', () => {
    expect(isValidExpiry('7/26', now)).toBe(false);
    expect(isValidExpiry('1226', now)).toBe(false);
  });
  it('rechaza mes fuera de rango', () => {
    expect(isValidExpiry('13/29', now)).toBe(false);
    expect(isValidExpiry('00/29', now)).toBe(false);
  });
});

describe('isValidCvc', () => {
  it('acepta 3 dígitos', () => {
    expect(isValidCvc('123')).toBe(true);
  });
  it('rechaza otros', () => {
    expect(isValidCvc('12')).toBe(false);
    expect(isValidCvc('1234')).toBe(false);
    expect(isValidCvc('abc')).toBe(false);
  });
});

describe('máscaras', () => {
  it('maskCardNumber agrupa de a 4', () => {
    expect(maskCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
  });
  it('maskExpiry formatea MM/YY', () => {
    expect(maskExpiry('1229')).toBe('12/29');
    expect(maskExpiry('12')).toBe('12');
  });
  it('lastFour devuelve los últimos 4', () => {
    expect(lastFour('4242 4242 4242 4242')).toBe('4242');
  });
});
