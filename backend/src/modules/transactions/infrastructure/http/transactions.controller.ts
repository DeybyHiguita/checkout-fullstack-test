import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { DomainException } from '../../../../shared/http/domain.exception';
import {
  CreatePendingTransactionUseCase,
  CreateTransactionError,
} from '../../application/create-pending-transaction.use-case';
import { GetTransactionUseCase } from '../../application/get-transaction.use-case';
import {
  ProcessPaymentError,
  ProcessPaymentUseCase,
} from '../../application/process-payment.use-case';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PayTransactionDto } from './dto/pay-transaction.dto';
import {
  toTransactionResponse,
  TransactionResponseDto,
} from './dto/transaction-response.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createPendingTransaction: CreatePendingTransactionUseCase,
    private readonly getTransaction: GetTransactionUseCase,
    private readonly processPayment: ProcessPaymentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const result = await this.createPendingTransaction.execute({
      productId: dto.productId,
      customer: dto.customer,
      delivery: dto.delivery,
    });

    if (!result.ok) {
      throw TransactionsController.toHttp(result.error);
    }
    return toTransactionResponse(result.value.transaction);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  async pay(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PayTransactionDto,
  ): Promise<TransactionResponseDto> {
    const result = await this.processPayment.execute({
      transactionId: id,
      cardToken: dto.cardToken,
      acceptanceToken: dto.acceptanceToken,
      installments: dto.installments ?? 1,
    });
    if (!result.ok) {
      throw TransactionsController.payToHttp(result.error);
    }
    return toTransactionResponse(result.value);
  }

  @Get(':id')
  async detail(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TransactionResponseDto> {
    const result = await this.getTransaction.byId(id);
    if (!result.ok) {
      throw TransactionsController.notFound(result.error.reference);
    }
    return toTransactionResponse(result.value);
  }

  @Get('number/:transactionNumber')
  async detailByNumber(
    @Param('transactionNumber') transactionNumber: string,
  ): Promise<TransactionResponseDto> {
    const result = await this.getTransaction.byNumber(transactionNumber);
    if (!result.ok) {
      throw TransactionsController.notFound(result.error.reference);
    }
    return toTransactionResponse(result.value);
  }

  private static toHttp(error: CreateTransactionError): DomainException {
    switch (error.type) {
      case 'PRODUCT_NOT_FOUND':
        return new DomainException({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'PRODUCT_NOT_FOUND',
          message: 'El producto no existe',
          details: { productId: error.productId },
        });
      case 'OUT_OF_STOCK':
        return new DomainException({
          statusCode: HttpStatus.CONFLICT,
          error: 'OUT_OF_STOCK',
          message: 'No hay unidades disponibles del producto',
          details: { productId: error.productId },
        });
      case 'CUSTOMER_VALIDATION':
        return new DomainException({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          error: 'VALIDATION_ERROR',
          message: 'Los datos del cliente son inválidos',
          details: { reason: error.detail.type },
        });
    }
  }

  private static payToHttp(error: ProcessPaymentError): DomainException {
    switch (error.type) {
      case 'TRANSACTION_NOT_FOUND':
        return TransactionsController.notFound(error.transactionId);
      case 'ALREADY_RESOLVED':
        return new DomainException({
          statusCode: HttpStatus.CONFLICT,
          error: 'TRANSACTION_ALREADY_RESOLVED',
          message: 'La transacción ya fue resuelta',
          details: { status: error.status },
        });
      case 'GATEWAY_UNAVAILABLE':
        return new DomainException({
          statusCode: HttpStatus.BAD_GATEWAY,
          error: 'GATEWAY_UNAVAILABLE',
          message:
            'La pasarela de pagos no está disponible; la transacción sigue pendiente',
          details: error.detail ? { detail: error.detail } : undefined,
        });
    }
  }

  private static notFound(reference: string): DomainException {
    return new DomainException({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'TRANSACTION_NOT_FOUND',
      message: 'La transacción no existe',
      details: { reference },
    });
  }
}
