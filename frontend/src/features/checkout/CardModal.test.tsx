import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Product } from '../../shared/types';
import { CardModal } from './CardModal';
import checkoutReducer from './checkoutSlice';
import productReducer from '../product/productSlice';
import { gatewayApi } from './gatewayApi';

jest.mock('./gatewayApi');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockedGateway = gatewayApi as jest.Mocked<typeof gatewayApi>;

const product: Product = {
  id: 'p1',
  name: 'Audífonos',
  description: '...',
  priceInCents: 45000000,
  currency: 'COP',
  imageUrl: 'https://img',
  availableQuantity: 4,
};

const setup = () => {
  const store = configureStore({
    reducer: { product: productReducer, checkout: checkoutReducer },
    preloadedState: { product: { items: [product], loading: false, error: null } },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/checkout/p1']}>
        <Routes>
          <Route path="/checkout/:productId" element={<CardModal />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText('Número de tarjeta'), {
    target: { value: '4242424242424242' },
  });
  fireEvent.change(screen.getByLabelText('Titular'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText('Expiración'), { target: { value: '1229' } });
  fireEvent.change(screen.getByLabelText('CVC'), { target: { value: '123' } });
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'jane@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Número doc.'), { target: { value: '1234567890' } });
  fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '3001234567' } });
  fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Cra 1' } });
  fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Bogotá' } });
  fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'Cundinamarca' } });
};

afterEach(() => jest.clearAllMocks());

describe('CardModal', () => {
  it('muestra el producto en el encabezado', () => {
    setup();
    expect(screen.getByText(/Audífonos/)).toBeInTheDocument();
  });

  it('detecta y muestra la marca de la tarjeta', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Número de tarjeta'), {
      target: { value: '5555555555554444' },
    });
    expect(screen.getByTestId('card-brand')).toHaveTextContent('MASTERCARD');
  });

  it('muestra errores al enviar un formulario inválido y no navega', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /continuar al resumen/i }));
    expect(await screen.findByText('Número de tarjeta inválido')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('tokeniza, guarda en el store y navega al resumen con datos válidos', async () => {
    mockedGateway.getAcceptanceToken.mockResolvedValue('acc-token');
    mockedGateway.tokenizeCard.mockResolvedValue('tok_test_4242');
    const store = setup();

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /continuar al resumen/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/summary'));
    const checkout = store.getState().checkout;
    expect(checkout.cardToken).toBe('tok_test_4242');
    expect(checkout.cardBrand).toBe('VISA');
    expect(checkout.cardLastFour).toBe('4242');
    expect(checkout.customer?.email).toBe('jane@example.com');
    expect(checkout.step).toBe('SUMMARY');
  });

  it('muestra error de servidor si la tokenización falla', async () => {
    mockedGateway.getAcceptanceToken.mockResolvedValue('acc-token');
    mockedGateway.tokenizeCard.mockRejectedValue(new Error('tarjeta rechazada'));
    setup();

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /continuar al resumen/i }));

    expect(await screen.findByText('tarjeta rechazada')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
