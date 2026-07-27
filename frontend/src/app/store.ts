import { configureStore } from '@reduxjs/toolkit';
import checkoutReducer from '../features/checkout/checkoutSlice';
import productReducer from '../features/product/productSlice';

export const store = configureStore({
  reducer: {
    product: productReducer,
    checkout: checkoutReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
