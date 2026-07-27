import { HttpStatus } from '@nestjs/common';
import { err, ok } from '../../../../shared/domain/result';
import { DomainException } from '../../../../shared/http/domain.exception';
import { Product } from '../../domain/product.entity';
import { GetProductUseCase } from '../../application/get-product.use-case';
import { GetProductsUseCase } from '../../application/get-products.use-case';
import { ProductsController } from './products.controller';

const product = new Product({
  id: 'p1',
  name: 'Audífonos',
  description: '...',
  priceInCents: 45000000,
  currency: 'COP',
  imageUrl: 'https://img',
});

describe('ProductsController', () => {
  it('list mapea los productos con su cantidad disponible', async () => {
    const getProducts = {
      execute: jest.fn().mockResolvedValue([{ product, availableQuantity: 4 }]),
    } as unknown as GetProductsUseCase;
    const controller = new ProductsController(
      getProducts,
      {} as GetProductUseCase,
    );
    const res = await controller.list();
    expect(res).toHaveLength(1);
    expect(res[0].availableQuantity).toBe(4);
    expect(res[0].id).toBe('p1');
  });

  it('detail devuelve el producto si existe', async () => {
    const getProduct = {
      execute: jest
        .fn()
        .mockResolvedValue(ok({ product, availableQuantity: 2 })),
    } as unknown as GetProductUseCase;
    const controller = new ProductsController(
      {} as GetProductsUseCase,
      getProduct,
    );
    const res = await controller.detail('p1');
    expect(res.availableQuantity).toBe(2);
  });

  it('detail lanza 404 si no existe', async () => {
    const getProduct = {
      execute: jest
        .fn()
        .mockResolvedValue(err({ type: 'PRODUCT_NOT_FOUND', productId: 'x' })),
    } as unknown as GetProductUseCase;
    const controller = new ProductsController(
      {} as GetProductsUseCase,
      getProduct,
    );
    await expect(controller.detail('x')).rejects.toBeInstanceOf(
      DomainException,
    );
    await controller.detail('x').catch((e: DomainException) => {
      expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
