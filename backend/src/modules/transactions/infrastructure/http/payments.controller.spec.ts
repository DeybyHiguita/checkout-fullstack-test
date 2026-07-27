import { HttpStatus } from '@nestjs/common';
import { err, ok } from '../../../../shared/domain/result';
import { DomainException } from '../../../../shared/http/domain.exception';
import { FakePaymentGateway } from '../../../../shared/testing/fakes';
import { GetAcceptanceTokenUseCase } from '../../application/get-acceptance-token.use-case';
import { PaymentsController } from './payments.controller';

describe('PaymentsController', () => {
  it('devuelve el acceptance token cuando la pasarela responde', async () => {
    const useCase = new GetAcceptanceTokenUseCase(
      new FakePaymentGateway({ acceptanceToken: ok('acc-123') }),
    );
    const controller = new PaymentsController(useCase);
    await expect(controller.acceptanceToken()).resolves.toEqual({
      acceptanceToken: 'acc-123',
    });
  });

  it('lanza 502 si la pasarela no está disponible', async () => {
    const useCase = new GetAcceptanceTokenUseCase(
      new FakePaymentGateway({
        acceptanceToken: err({ type: 'GATEWAY_UNAVAILABLE' }),
      }),
    );
    const controller = new PaymentsController(useCase);
    try {
      await controller.acceptanceToken();
      throw new Error('debió lanzar');
    } catch (e) {
      expect(e).toBeInstanceOf(DomainException);
      expect((e as DomainException).getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    }
  });
});
