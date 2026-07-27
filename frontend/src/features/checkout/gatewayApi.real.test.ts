jest.mock('./gatewayEnv', () => ({
  GATEWAY_PUBLIC_KEY: 'pub_test_x',
  GATEWAY_BASE_URL: 'https://gw.example/v1',
}));

import { gatewayApi } from './gatewayApi';

const fetchMock = jest.fn();
beforeEach(() => {
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});
afterEach(() => jest.resetAllMocks());

const card = {
  number: '4242 4242 4242 4242',
  cvc: '123',
  expMonth: '12',
  expYear: '29',
  holder: 'Jane',
};

describe('gatewayApi (modo real, con llaves)', () => {
  it('tokeniza contra la pasarela con la llave pública', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'CREATED', data: { id: 'tok_real_123' } }),
    });
    await expect(gatewayApi.tokenizeCard(card)).resolves.toBe('tok_real_123');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://gw.example/v1/tokens/cards',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer pub_test_x' }),
      }),
    );
  });

  it('lanza error si la pasarela no crea el token', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ status: 'ERROR' }),
    });
    await expect(gatewayApi.tokenizeCard(card)).rejects.toThrow(/No se pudo tokenizar/);
  });
});
