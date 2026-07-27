import { validateForm, type CheckoutForm } from './cardFormValidation';

const valid: CheckoutForm = {
  cardNumber: '4242 4242 4242 4242',
  cardHolder: 'Jane Doe',
  expiry: '12/29',
  cvc: '123',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  documentType: 'CC',
  documentNumber: '1234567890',
  phoneNumber: '3001234567',
  addressLine: 'Cra 1',
  city: 'Bogotá',
  region: 'Cundinamarca',
  postalCode: '',
  country: 'CO',
};

const now = new Date('2026-07-15T12:00:00Z');

describe('validateForm', () => {
  it('no devuelve errores con un formulario válido', () => {
    expect(Object.keys(validateForm(valid, now))).toHaveLength(0);
  });

  it('detecta tarjeta con Luhn inválido', () => {
    expect(
      validateForm({ ...valid, cardNumber: '4242 4242 4242 4241' }, now).cardNumber,
    ).toBeDefined();
  });

  it('rechaza marca no soportada (ni Visa ni MasterCard)', () => {
    // 6011... pasa Luhn pero no es Visa/MC
    expect(validateForm({ ...valid, cardNumber: '6011 0000 0000 0004' }, now).cardNumber).toBe(
      'Solo Visa o MasterCard',
    );
  });

  it('marca errores en campos de comprador y entrega vacíos', () => {
    const errors = validateForm(
      { ...valid, email: 'malo', documentNumber: '12', addressLine: '', city: '', region: '' },
      now,
    );
    expect(errors.email).toBeDefined();
    expect(errors.documentNumber).toBeDefined();
    expect(errors.addressLine).toBeDefined();
    expect(errors.city).toBeDefined();
    expect(errors.region).toBeDefined();
  });

  it('rechaza expiración vencida', () => {
    expect(validateForm({ ...valid, expiry: '01/20' }, now).expiry).toBeDefined();
  });
});
