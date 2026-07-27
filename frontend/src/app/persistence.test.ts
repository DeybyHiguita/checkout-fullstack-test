import type { CheckoutState } from '../features/checkout/checkoutSlice';
import { clearCheckoutState, loadCheckoutState, saveCheckoutState } from './persistence';

const sample: CheckoutState = {
  step: 'SUMMARY',
  productId: 'p1',
  customer: null,
  delivery: null,
  cardBrand: 'VISA',
  cardLastFour: '4242',
  cardToken: 'tok_1',
  acceptanceToken: 'acc',
  transactionId: 't1',
  transactionNumber: 'TXN-1',
};

describe('persistencia del checkout', () => {
  beforeEach(() => localStorage.clear());

  it('guarda y recupera el estado', () => {
    saveCheckoutState(sample);
    expect(loadCheckoutState()).toEqual(sample);
  });

  it('devuelve undefined si no hay nada guardado', () => {
    expect(loadCheckoutState()).toBeUndefined();
  });

  it('devuelve undefined si el contenido es inválido', () => {
    localStorage.setItem('checkout-state-v1', '{no-json');
    expect(loadCheckoutState()).toBeUndefined();
  });

  it('clear elimina el estado', () => {
    saveCheckoutState(sample);
    clearCheckoutState();
    expect(loadCheckoutState()).toBeUndefined();
  });
});
