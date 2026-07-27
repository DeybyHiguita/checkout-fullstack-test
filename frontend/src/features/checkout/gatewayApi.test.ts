import { apiClient } from '../../shared/api/client';
import { gatewayApi } from './gatewayApi';

jest.mock('../../shared/api/client');
const mocked = apiClient as jest.Mocked<typeof apiClient>;

const card = {
  number: '4242 4242 4242 4242',
  cvc: '123',
  expMonth: '12',
  expYear: '29',
  holder: 'Jane',
};

describe('gatewayApi (modo simulado, sin llaves)', () => {
  afterEach(() => jest.clearAllMocks());

  it('getAcceptanceToken usa el backend', async () => {
    mocked.get.mockResolvedValue({ acceptanceToken: 'acc-123' });
    await expect(gatewayApi.getAcceptanceToken()).resolves.toBe('acc-123');
    expect(mocked.get).toHaveBeenCalledWith('/payments/acceptance-token');
  });

  it('tokenizeCard aprueba con tarjeta normal', async () => {
    await expect(gatewayApi.tokenizeCard(card)).resolves.toBe('tok_test_4242');
  });

  it('tokenizeCard declina con tarjeta terminada en 0002', async () => {
    await expect(gatewayApi.tokenizeCard({ ...card, number: '4000 0000 0000 0002' })).resolves.toBe(
      'tok_decline_sim',
    );
  });

  it('tokenizeCard da error con tarjeta terminada en 0119', async () => {
    await expect(gatewayApi.tokenizeCard({ ...card, number: '4000 0000 0000 0119' })).resolves.toBe(
      'tok_error_sim',
    );
  });
});
