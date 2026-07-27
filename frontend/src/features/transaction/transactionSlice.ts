import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiError } from '../../shared/api/client';
import {
  transactionApi,
  type Amounts,
  type CreateTransactionBody,
  type PayBody,
  type TransactionResponse,
} from './transactionApi';

export type UiTransactionStatus = 'IDLE' | 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export interface TransactionState {
  transactionId: string | null;
  transactionNumber: string | null;
  status: UiTransactionStatus;
  amounts: Amounts | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  transactionId: null,
  transactionNumber: null,
  status: 'IDLE',
  amounts: null,
  cardBrand: null,
  cardLastFour: null,
  loading: false,
  error: null,
};

const toMessage = (e: unknown, fallback: string): string =>
  e instanceof ApiError ? e.message : fallback;

export const createTransaction = createAsyncThunk<
  TransactionResponse,
  CreateTransactionBody,
  { rejectValue: string }
>('transaction/create', async (body, { rejectWithValue }) => {
  try {
    return await transactionApi.create(body);
  } catch (e) {
    return rejectWithValue(toMessage(e, 'No se pudo crear la transacción'));
  }
});

export const payTransaction = createAsyncThunk<
  TransactionResponse,
  { id: string; body: PayBody },
  { rejectValue: string }
>('transaction/pay', async ({ id, body }, { rejectWithValue }) => {
  try {
    return await transactionApi.pay(id, body);
  } catch (e) {
    return rejectWithValue(toMessage(e, 'La pasarela no está disponible; intenta de nuevo'));
  }
});

export const fetchTransaction = createAsyncThunk<
  TransactionResponse,
  string,
  { rejectValue: string }
>('transaction/fetch', async (id, { rejectWithValue }) => {
  try {
    return await transactionApi.getById(id);
  } catch (e) {
    return rejectWithValue(toMessage(e, 'No se pudo consultar la transacción'));
  }
});

const applyResponse = (state: TransactionState, payload: TransactionResponse) => {
  state.transactionId = payload.transactionId;
  state.transactionNumber = payload.transactionNumber;
  state.status = payload.status === 'VOIDED' ? 'DECLINED' : payload.status;
  state.amounts = payload.amounts;
  state.cardBrand = payload.cardBrand;
  state.cardLastFour = payload.cardLastFour;
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    resetTransaction: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        applyResponse(state, action.payload);
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Error al crear la transacción';
      })
      .addCase(payTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(payTransaction.fulfilled, (state, action) => {
        state.loading = false;
        applyResponse(state, action.payload);
      })
      .addCase(payTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Error al procesar el pago';
      })
      .addCase(fetchTransaction.fulfilled, (state, action) => {
        if (action.payload) applyResponse(state, action.payload);
      });
  },
});

export const { resetTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
