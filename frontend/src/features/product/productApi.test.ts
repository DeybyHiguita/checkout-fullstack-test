import { apiClient } from '../../shared/api/client';
import { productApi } from './productApi';

jest.mock('../../shared/api/client');

const mocked = apiClient as jest.Mocked<typeof apiClient>;

describe('productApi', () => {
  afterEach(() => jest.clearAllMocks());

  it('list llama GET /products', async () => {
    mocked.get.mockResolvedValue([]);
    await productApi.list();
    expect(mocked.get).toHaveBeenCalledWith('/products');
  });

  it('getById llama GET /products/:id', async () => {
    mocked.get.mockResolvedValue({});
    await productApi.getById('p1');
    expect(mocked.get).toHaveBeenCalledWith('/products/p1');
  });
});
