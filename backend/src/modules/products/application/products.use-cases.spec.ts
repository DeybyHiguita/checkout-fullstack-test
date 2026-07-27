import {
  FakeProductRepository,
  FakeStockRepository,
} from '../../../shared/testing/fakes';
import { StockItem } from '../../stock/domain/stock-item.entity';
import { Product } from '../domain/product.entity';
import { GetProductUseCase } from './get-product.use-case';
import { GetProductsUseCase } from './get-products.use-case';

const product = new Product({
  id: 'p1',
  name: 'Audífonos',
  description: '...',
  priceInCents: 45000000,
  currency: 'COP',
  imageUrl: 'https://img',
});

describe('GetProductsUseCase', () => {
  it('devuelve productos con su cantidad comprable (disponible - reservado)', async () => {
    const products = new FakeProductRepository([product]);
    const stock = new FakeStockRepository([
      new StockItem({
        id: 's1',
        productId: 'p1',
        availableQuantity: 5,
        reservedQuantity: 2,
      }),
    ]);
    const result = await new GetProductsUseCase(products, stock).execute();
    expect(result).toHaveLength(1);
    expect(result[0].availableQuantity).toBe(3);
  });

  it('reporta 0 disponibles si no hay stock item', async () => {
    const products = new FakeProductRepository([product]);
    const stock = new FakeStockRepository([]);
    const result = await new GetProductsUseCase(products, stock).execute();
    expect(result[0].availableQuantity).toBe(0);
  });
});

describe('GetProductUseCase', () => {
  it('devuelve el producto si existe', async () => {
    const products = new FakeProductRepository([product]);
    const stock = new FakeStockRepository([
      new StockItem({
        id: 's1',
        productId: 'p1',
        availableQuantity: 4,
        reservedQuantity: 0,
      }),
    ]);
    const result = await new GetProductUseCase(products, stock).execute('p1');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.availableQuantity).toBe(4);
  });

  it('falla con PRODUCT_NOT_FOUND si no existe', async () => {
    const result = await new GetProductUseCase(
      new FakeProductRepository([]),
      new FakeStockRepository([]),
    ).execute('nope');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('PRODUCT_NOT_FOUND');
  });
});
