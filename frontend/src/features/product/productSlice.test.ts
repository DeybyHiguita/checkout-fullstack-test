import { ApiError } from '../../shared/api/client';
import type { Product } from '../../shared/types';
import productReducer, { fetchProducts, type ProductState } from './productSlice';
import { productApi } from './productApi';

jest.mock('./productApi');

const product: Product = {
  id: 'p1',
  name: 'Audífonos',
  description: '...',
  priceInCents: 45000000,
  currency: 'COP',
  imageUrl: 'https://img',
  availableQuantity: 4,
};

const initial: ProductState = { items: [], loading: false, error: null };

describe('productSlice reducer', () => {
  it('pending activa loading y limpia el error', () => {
    const state = productReducer(
      { ...initial, error: 'prev' },
      { type: fetchProducts.pending.type },
    );
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('fulfilled guarda los productos y apaga loading', () => {
    const state = productReducer(
      { ...initial, loading: true },
      { type: fetchProducts.fulfilled.type, payload: [product] },
    );
    expect(state.loading).toBe(false);
    expect(state.items).toHaveLength(1);
  });

  it('rejected guarda el mensaje de error', () => {
    const state = productReducer(
      { ...initial, loading: true },
      { type: fetchProducts.rejected.type, payload: 'boom' },
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('boom');
  });
});

describe('fetchProducts thunk', () => {
  const mockedApi = productApi as jest.Mocked<typeof productApi>;
  afterEach(() => jest.clearAllMocks());

  it('resuelve con los productos', async () => {
    mockedApi.list.mockResolvedValue([product]);
    const dispatch = jest.fn();
    const thunk = fetchProducts();
    const result = await thunk(dispatch, () => ({}), undefined);
    expect(result.type).toBe(fetchProducts.fulfilled.type);
    expect(result.payload).toEqual([product]);
  });

  it('rechaza con el mensaje del ApiError', async () => {
    mockedApi.list.mockRejectedValue(
      new ApiError({ statusCode: 500, error: 'X', message: 'falló' }),
    );
    const thunk = fetchProducts();
    const result = await thunk(jest.fn(), () => ({}), undefined);
    expect(result.type).toBe(fetchProducts.rejected.type);
    expect(result.payload).toBe('falló');
  });
});
