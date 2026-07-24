import { err, ok, Result } from '../../../shared/domain/result';

export type StockError =
  | { type: 'INSUFFICIENT_STOCK'; productId: string }
  | { type: 'NO_RESERVATION'; productId: string };

export interface StockItemProps {
  id: string;
  productId: string;
  availableQuantity: number;
  reservedQuantity: number;
}

/**
 * StockItem de dominio. Reglas de negocio del inventario, puras e inmutables:
 * cada operación devuelve un StockItem nuevo dentro de un Result.
 *
 * - `sellableQuantity` = disponible en mano - reservado por transacciones PENDING.
 * - `reserve()`  al crear una transacción PENDING (evita overselling concurrente).
 * - `confirmSale()` al aprobarse (decrementa disponible y libera la reserva).
 * - `release()`  al declinarse/fallar (solo libera la reserva).
 */
export class StockItem {
  readonly id: string;
  readonly productId: string;
  readonly availableQuantity: number;
  readonly reservedQuantity: number;

  constructor(props: StockItemProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.availableQuantity = props.availableQuantity;
    this.reservedQuantity = props.reservedQuantity;
  }

  get sellableQuantity(): number {
    return this.availableQuantity - this.reservedQuantity;
  }

  reserve(): Result<StockItem, StockError> {
    if (this.sellableQuantity <= 0) {
      return err({ type: 'INSUFFICIENT_STOCK', productId: this.productId });
    }
    return ok(
      this.withQuantities(this.availableQuantity, this.reservedQuantity + 1),
    );
  }

  confirmSale(): Result<StockItem, StockError> {
    if (this.reservedQuantity <= 0) {
      return err({ type: 'NO_RESERVATION', productId: this.productId });
    }
    return ok(
      this.withQuantities(
        this.availableQuantity - 1,
        this.reservedQuantity - 1,
      ),
    );
  }

  release(): Result<StockItem, StockError> {
    if (this.reservedQuantity <= 0) {
      return err({ type: 'NO_RESERVATION', productId: this.productId });
    }
    return ok(
      this.withQuantities(this.availableQuantity, this.reservedQuantity - 1),
    );
  }

  private withQuantities(
    availableQuantity: number,
    reservedQuantity: number,
  ): StockItem {
    return new StockItem({
      id: this.id,
      productId: this.productId,
      availableQuantity,
      reservedQuantity,
    });
  }
}
