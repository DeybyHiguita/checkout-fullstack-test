import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CardBrand } from './validators/cardBrand';

export type CheckoutStep = 'PRODUCT' | 'CARD_DELIVERY' | 'SUMMARY' | 'RESULT';

export interface CustomerForm {
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  phoneNumber: string;
}

export interface DeliveryForm {
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface CheckoutState {
  step: CheckoutStep;
  productId: string | null;
  customer: CustomerForm | null;
  delivery: DeliveryForm | null;
  // Datos de tarjeta: SOLO lo no sensible. Nunca el PAN ni el CVC.
  cardBrand: CardBrand | null;
  cardLastFour: string | null;
  cardToken: string | null;
  acceptanceToken: string | null;
  transactionId: string | null;
  transactionNumber: string | null;
}

const initialState: CheckoutState = {
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
};

export interface CardDeliverySubmit {
  productId: string;
  customer: CustomerForm;
  delivery: DeliveryForm;
  cardBrand: CardBrand;
  cardLastFour: string;
  cardToken: string;
  acceptanceToken: string;
}

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    startCheckout(state, action: PayloadAction<string>) {
      state.productId = action.payload;
      state.step = 'CARD_DELIVERY';
    },
    submitCardDelivery(state, action: PayloadAction<CardDeliverySubmit>) {
      const p = action.payload;
      state.productId = p.productId;
      state.customer = p.customer;
      state.delivery = p.delivery;
      state.cardBrand = p.cardBrand;
      state.cardLastFour = p.cardLastFour;
      state.cardToken = p.cardToken;
      state.acceptanceToken = p.acceptanceToken;
      state.step = 'SUMMARY';
    },
    /** Guarda la transacción pendiente sin avanzar de paso (para el resumen). */
    setPendingTransaction(state, action: PayloadAction<{ id: string; number: string }>) {
      state.transactionId = action.payload.id;
      state.transactionNumber = action.payload.number;
    },
    setTransaction(state, action: PayloadAction<{ id: string; number: string }>) {
      state.transactionId = action.payload.id;
      state.transactionNumber = action.payload.number;
      state.step = 'RESULT';
    },
    setStep(state, action: PayloadAction<CheckoutStep>) {
      state.step = action.payload;
    },
    resetCheckout() {
      return initialState;
    },
  },
});

export const {
  startCheckout,
  submitCardDelivery,
  setPendingTransaction,
  setTransaction,
  setStep,
  resetCheckout,
} = checkoutSlice.actions;
export default checkoutSlice.reducer;
