import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Product } from '../../shared/types';
import { ProductPage } from './ProductPage';
import productReducer from './productSlice';
import { productApi } from './productApi';

jest.mock('./productApi');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockedApi = productApi as jest.Mocked<typeof productApi>;

const product = (over: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Audífonos',
  description: 'Buenos audífonos',
  priceInCents: 45000000,
  currency: 'COP',
  imageUrl: 'https://img',
  availableQuantity: 4,
  ...over,
});

const renderPage = () => {
  const store = configureStore({ reducer: { product: productReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ProductPage />
      </MemoryRouter>
    </Provider>,
  );
};

afterEach(() => jest.clearAllMocks());

describe('ProductPage', () => {
  it('muestra el estado de carga', () => {
    mockedApi.list.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent(/cargando/i);
  });

  it('renderiza el catálogo con precio y stock', async () => {
    mockedApi.list.mockResolvedValue([product()]);
    renderPage();
    expect(await screen.findByText('Audífonos')).toBeInTheDocument();
    expect(screen.getByText(/450\.000/)).toBeInTheDocument();
    expect(screen.getByText(/4 disponibles/)).toBeInTheDocument();
  });

  it('deshabilita el CTA y marca agotado cuando no hay stock', async () => {
    mockedApi.list.mockResolvedValue([product({ availableQuantity: 0 })]);
    renderPage();
    expect(await screen.findByText('Agotado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pagar con tarjeta/i })).toBeDisabled();
  });

  it('muestra el error y permite reintentar', async () => {
    mockedApi.list.mockRejectedValueOnce(new Error('down'));
    renderPage();
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    mockedApi.list.mockResolvedValueOnce([product()]);
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText('Audífonos')).toBeInTheDocument();
  });

  it('navega al checkout al pulsar el CTA', async () => {
    mockedApi.list.mockResolvedValue([product()]);
    renderPage();
    await screen.findByText('Audífonos');
    await userEvent.click(screen.getByRole('button', { name: /pagar con tarjeta/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout/p1');
  });
});
