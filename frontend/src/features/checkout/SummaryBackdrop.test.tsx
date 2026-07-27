import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Product } from '../../shared/types';
import productReducer from '../product/productSlice';
import transactionReducer from '../transaction/transactionSlice';
import { transactionApi, type TransactionResponse } from '../transaction/transactionApi';
import checkoutReducer, { type CheckoutState } from './checkoutSlice';
import { SummaryBackdrop } from './SummaryBackdrop';

jest.mock('../transaction/transactionApi');
const mockedApi = transactionApi as jest.Mocked<typeof transactionApi>;
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const product: Product = {
  id: 'p1',
  name: 'Audífonos',
  description: '...',
  priceInCents: 45000000,
  currency: 'COP',
  imageUrl: 'https://img',
  availableQuantity: 4,
};

const checkout = (over: Partial<CheckoutState> = {}): CheckoutState => ({
  step: 'SUMMARY',
  productId: 'p1',
  customer: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    documentType: 'CC',
    documentNumber: '1234567890',
    phoneNumber: '3001234567',
  },
  delivery: { addressLine: 'Cra 1', city: 'Bogotá', region: 'Cund', postalCode: '', country: 'CO' },
  cardBrand: 'VISA',
  cardLastFour: '4242',
  cardToken: 'tok_test_4242',
  acceptanceToken: 'acc',
  transactionId: null,
  transactionNumber: null,
  ...over,
});

const response = (over: Partial<TransactionResponse> = {}): TransactionResponse => ({
  transactionId: 't1',
  transactionNumber: 'TXN-1',
  status: 'PENDING',
  amounts: {
    productAmountInCents: 45000000,
    baseFeeInCents: 350000,
    deliveryFeeInCents: 800000,
    totalAmountInCents: 46150000,
    currency: 'COP',
  },
  cardBrand: null,
  cardLastFour: null,
  createdAt: '2026-07-24T12:00:00Z',
  updatedAt: '2026-07-24T12:00:00Z',
  ...over,
});

const setup = (checkoutState: CheckoutState) => {
  const store = configureStore({
    reducer: {
      product: productReducer,
      checkout: checkoutReducer,
      transaction: transactionReducer,
    },
    preloadedState: {
      product: { items: [product], loading: false, error: null },
      checkout: checkoutState,
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <SummaryBackdrop />
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

afterEach(() => jest.clearAllMocks());

describe('SummaryBackdrop', () => {
  it('crea la transacción al entrar y muestra el desglose de totales', async () => {
    mockedApi.create.mockResolvedValue(response());
    setup(checkout());

    // El botón de pago incluye el total.
    expect(await screen.findByRole('button', { name: /pagar.*461\.500/i })).toBeInTheDocument();
    expect(screen.getByText('Tarifa base')).toBeInTheDocument();
    expect(screen.getByText('Envío')).toBeInTheDocument();
    expect(screen.getByText(/450\.000/)).toBeInTheDocument(); // línea de producto
    expect(mockedApi.create).toHaveBeenCalledTimes(1);
  });

  it('al refrescar (ya hay transactionId) reconcilia en vez de crear otra', async () => {
    mockedApi.getById.mockResolvedValue(response({ transactionId: 't9' }));
    setup(checkout({ transactionId: 't9', transactionNumber: 'TXN-9' }));

    await waitFor(() => expect(mockedApi.getById).toHaveBeenCalledWith('t9'));
    expect(mockedApi.create).not.toHaveBeenCalled();
  });

  it('paga y navega al resultado cuando la pasarela aprueba', async () => {
    mockedApi.create.mockResolvedValue(response());
    mockedApi.pay.mockResolvedValue(response({ status: 'APPROVED', cardLastFour: '4242' }));
    const store = setup(checkout());

    await screen.findByRole('button', { name: /pagar/i });
    await userEvent.click(screen.getByRole('button', { name: /pagar/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/result'));
    expect(store.getState().transaction.status).toBe('APPROVED');
  });

  it('muestra error y no navega si la pasarela no está disponible', async () => {
    mockedApi.create.mockResolvedValue(response());
    const { ApiError } = jest.requireActual(
      '../../shared/api/client',
    ) as typeof import('../../shared/api/client');
    mockedApi.pay.mockRejectedValue(
      new ApiError({ statusCode: 502, error: 'GATEWAY_UNAVAILABLE', message: 'pasarela caída' }),
    );
    setup(checkout());

    await screen.findByRole('button', { name: /pagar/i });
    await userEvent.click(screen.getByRole('button', { name: /pagar/i }));

    expect(await screen.findByText('pasarela caída')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/result');
  });
});
