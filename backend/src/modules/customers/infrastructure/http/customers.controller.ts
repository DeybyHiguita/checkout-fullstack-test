import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DomainException } from '../../../../shared/http/domain.exception';
import { GetCustomerUseCase } from '../../application/get-customer.use-case';

interface CustomerResponseDto {
  id: string;
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  phoneNumber: string;
}

@Controller('customers')
export class CustomersController {
  constructor(private readonly getCustomer: GetCustomerUseCase) {}

  @Get(':id')
  async detail(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CustomerResponseDto> {
    const result = await this.getCustomer.execute(id);
    if (!result.ok) {
      throw new DomainException({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'CUSTOMER_NOT_FOUND',
        message: 'El cliente no existe',
        details: { customerId: result.error.customerId },
      });
    }
    const c = result.value;
    return {
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      documentType: c.documentType,
      documentNumber: c.documentNumber,
      phoneNumber: c.phoneNumber,
    };
  }
}
