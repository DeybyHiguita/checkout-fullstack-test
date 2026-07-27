import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiError } from '../../shared/api/client';
import type { Product } from '../../shared/types';
import { productApi } from './productApi';

export interface ProductState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk<Product[], void, { rejectValue: string }>(
  'product/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      return await productApi.list();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'No se pudieron cargar los productos';
      return rejectWithValue(message);
    }
  },
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Error al cargar productos';
      });
  },
});

export default productSlice.reducer;
