import { ApiError, apiClient } from './client';

const fetchMock = jest.fn();

beforeEach(() => {
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});
afterEach(() => jest.resetAllMocks());

const response = (init: { ok: boolean; status: number; json: () => Promise<unknown> }) =>
  init as unknown as Response;

describe('apiClient', () => {
  it('get devuelve el JSON en respuesta exitosa', async () => {
    fetchMock.mockResolvedValue(
      response({ ok: true, status: 200, json: () => Promise.resolve([{ id: '1' }]) }),
    );
    const result = await apiClient.get<{ id: string }[]>('/products');
    expect(result).toEqual([{ id: '1' }]);
  });

  it('lanza ApiError con el shape del backend en respuesta de error', async () => {
    fetchMock.mockResolvedValue(
      response({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({ statusCode: 409, error: 'OUT_OF_STOCK', message: 'sin stock' }),
      }),
    );
    await expect(apiClient.get('/x')).rejects.toMatchObject({
      code: 'OUT_OF_STOCK',
      statusCode: 409,
      message: 'sin stock',
    });
    await expect(apiClient.get('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('lanza ApiError genérico si el cuerpo de error no es JSON', async () => {
    fetchMock.mockResolvedValue(
      response({ ok: false, status: 500, json: () => Promise.reject(new Error('no json')) }),
    );
    await expect(apiClient.get('/x')).rejects.toMatchObject({ statusCode: 500 });
  });

  it('post envía el cuerpo serializado', async () => {
    fetchMock.mockResolvedValue(
      response({ ok: true, status: 201, json: () => Promise.resolve({ ok: true }) }),
    );
    await apiClient.post('/transactions', { productId: 'p1' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/transactions'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ productId: 'p1' }) }),
    );
  });
});
