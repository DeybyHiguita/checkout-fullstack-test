import { configureStore } from '@reduxjs/toolkit';
import checkoutReducer from '../features/checkout/checkoutSlice';
import productReducer from '../features/product/productSlice';
import transactionReducer from '../features/transaction/transactionSlice';
import { loadCheckoutState, saveCheckoutState } from './persistence';

const persistedCheckout = loadCheckoutState();

export const store = configureStore({
  reducer: {
    product: productReducer,
    checkout: checkoutReducer,
    transaction: transactionReducer,
  },
  preloadedState: persistedCheckout ? { checkout: persistedCheckout } : undefined,
});

// Persiste el slice checkout ante cada cambio (resiliencia ante refresh).
store.subscribe(() => saveCheckoutState(store.getState().checkout));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
