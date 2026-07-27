import { Controller, Get, HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../../shared/http/domain.exception';
import { GetAcceptanceTokenUseCase } from '../../application/get-acceptance-token.use-case';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly getAcceptanceToken: GetAcceptanceTokenUseCase) {}

  @Get('acceptance-token')
  async acceptanceToken(): Promise<{ acceptanceToken: string }> {
    const result = await this.getAcceptanceToken.execute();
    if (!result.ok) {
      throw new DomainException({
        statusCode: HttpStatus.BAD_GATEWAY,
        error: 'GATEWAY_UNAVAILABLE',
        message: 'No se pudo obtener el token de aceptación de la pasarela',
        details: { reason: result.error.type },
      });
    }
    return { acceptanceToken: result.value };
  }
}
