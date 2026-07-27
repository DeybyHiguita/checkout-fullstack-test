import reducer, {
  resetCheckout,
  setStep,
  setTransaction,
  startCheckout,
  submitCardDelivery,
  type CheckoutState,
} from './checkoutSlice';

const state = (over: Partial<CheckoutState> = {}): CheckoutState => ({
  step: 'PRODUCT',
  productId: null,
  customer: null,
  delivery: null,
  cardBrand: null,
  cardLastFour: null,
  cardToken: null,
  acceptanceToken: null,
  transactionId: null,
  transactionNumber: null,
  ...over,
});

const submitPayload = {
  productId: 'p1',
  customer: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    documentType: 'CC',
    documentNumber: '1234567890',
    phoneNumber: '3001234567',
  },
  delivery: {
    addressLine: 'Cra 1',
    city: 'Bogotá',
    region: 'Cund',
    postalCode: '',
    country: 'CO',
  },
  cardBrand: 'VISA' as const,
  cardLastFour: '4242',
  cardToken: 'tok_1',
  acceptanceToken: 'acc',
};

describe('checkoutSlice', () => {
  it('startCheckout fija productId y pasa a CARD_DELIVERY', () => {
    const next = reducer(state(), startCheckout('p1'));
    expect(next.productId).toBe('p1');
    expect(next.step).toBe('CARD_DELIVERY');
  });

  it('submitCardDelivery guarda datos (sin PAN/CVC) y pasa a SUMMARY', () => {
    const next = reducer(state(), submitCardDelivery(submitPayload));
    expect(next.step).toBe('SUMMARY');
    expect(next.cardToken).toBe('tok_1');
    expect(next.cardBrand).toBe('VISA');
    expect(next.cardLastFour).toBe('4242');
    expect(next.customer?.email).toBe('jane@example.com');
    // No hay campos de PAN/CVC en el estado
    expect(Object.keys(next)).not.toContain('cardNumber');
    expect(Object.keys(next)).not.toContain('cvc');
  });

  it('setTransaction guarda id/número y pasa a RESULT', () => {
    const next = reducer(state({ step: 'SUMMARY' }), setTransaction({ id: 't1', number: 'TXN-1' }));
    expect(next.transactionId).toBe('t1');
    expect(next.transactionNumber).toBe('TXN-1');
    expect(next.step).toBe('RESULT');
  });

  it('setStep cambia el paso', () => {
    expect(reducer(state(), setStep('SUMMARY')).step).toBe('SUMMARY');
  });

  it('resetCheckout vuelve al estado inicial', () => {
    const dirty = state({ step: 'RESULT', productId: 'p1', cardToken: 'tok' });
    expect(reducer(dirty, resetCheckout()).step).toBe('PRODUCT');
    expect(reducer(dirty, resetCheckout()).cardToken).toBeNull();
  });
});
