import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DomainException } from '../../../../shared/http/domain.exception';
import { GetProductUseCase } from '../../application/get-product.use-case';
import { GetProductsUseCase } from '../../application/get-products.use-case';
import {
  ProductResponseDto,
  toProductResponse,
} from './dto/product-response.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly getProducts: GetProductsUseCase,
    private readonly getProduct: GetProductUseCase,
  ) {}

  @Get()
  async list(): Promise<ProductResponseDto[]> {
    const products = await this.getProducts.execute();
    return products.map(toProductResponse);
  }

  @Get(':id')
  async detail(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ProductResponseDto> {
    const result = await this.getProduct.execute(id);
    if (!result.ok) {
      throw new DomainException({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'PRODUCT_NOT_FOUND',
        message: 'El producto no existe',
        details: { productId: result.error.productId },
      });
    }
    return toProductResponse(result.value);
  }
}
