import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import checkoutReducer, { type CheckoutState } from '../checkout/checkoutSlice';
import productReducer from '../product/productSlice';
import { productApi } from '../product/productApi';
import { ResultPage } from './ResultPage';
import transactionReducer, { type TransactionState } from './transactionSlice';
import { transactionApi } from './transactionApi';

jest.mock('../product/productApi');
jest.mock('./transactionApi');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const checkout = (over: Partial<CheckoutState> = {}): CheckoutState => ({
  step: 'RESULT',
  productId: 'p1',
  customer: null,
  delivery: null,
  cardBrand: 'VISA',
  cardLastFour: '4242',
  cardToken: 'tok',
  acceptanceToken: 'acc',
  transactionId: 't1',
  transactionNumber: 'TXN-1',
  ...over,
});

const transaction = (over: Partial<TransactionState> = {}): TransactionState => ({
  transactionId: 't1',
  transactionNumber: 'TXN-1',
  status: 'APPROVED',
  amounts: {
    productAmountInCents: 45000000,
    baseFeeInCents: 350000,
    deliveryFeeInCents: 800000,
    totalAmountInCents: 46150000,
    currency: 'COP',
  },
  cardBrand: 'VISA',
  cardLastFour: '4242',
  loading: false,
  error: null,
  ...over,
});

const setup = (t: TransactionState, c: CheckoutState = checkout()) => {
  const store = configureStore({
    reducer: {
      product: productReducer,
      checkout: checkoutReducer,
      transaction: transactionReducer,
    },
    preloadedState: {
      checkout: c,
      transaction: t,
      product: { items: [], loading: false, error: null },
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ResultPage />
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

afterEach(() => jest.clearAllMocks());

describe('ResultPage', () => {
  it('muestra estado APROBADO con el número y el total', () => {
    setup(transaction());
    expect(screen.getByText('¡Pago aprobado!')).toBeInTheDocument();
    expect(screen.getByText('TXN-1')).toBeInTheDocument();
    expect(screen.getByText(/461\.500/)).toBeInTheDocument();
  });

  it('“Volver al producto” refresca stock, limpia y navega a inicio', async () => {
    (productApi as jest.Mocked<typeof productApi>).list.mockResolvedValue([]);
    setup(transaction());
    await userEvent.click(screen.getByRole('button', { name: /volver al producto/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('muestra DECLINADO y permite volver a intentar', async () => {
    setup(transaction({ status: 'DECLINED' }));
    expect(screen.getByText('Pago rechazado')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /volver a intentar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout/p1');
  });

  it('muestra ERROR técnico cuando hay error de pasarela', () => {
    setup(transaction({ status: 'ERROR', error: 'pasarela caída' }));
    expect(screen.getByText('No se pudo procesar')).toBeInTheDocument();
  });

  it('tras refresh (status IDLE con id) consulta la transacción', async () => {
    (transactionApi as jest.Mocked<typeof transactionApi>).getById.mockResolvedValue({
      transactionId: 't1',
      transactionNumber: 'TXN-1',
      status: 'APPROVED',
      amounts: {
        productAmountInCents: 45000000,
        baseFeeInCents: 350000,
        deliveryFeeInCents: 800000,
        totalAmountInCents: 46150000,
        currency: 'COP',
      },
      cardBrand: 'VISA',
      cardLastFour: '4242',
      createdAt: '',
      updatedAt: '',
    });
    setup(transaction({ status: 'IDLE', amounts: null }));
    await waitFor(() => expect(transactionApi.getById).toHaveBeenCalledWith('t1'));
  });

  it('muestra estado PENDING (procesando)', () => {
    setup(transaction({ status: 'PENDING' }));
    expect(screen.getByText('Procesando pago…')).toBeInTheDocument();
  });
});
