import { StockItem } from './stock-item.entity';

const make = (available: number, reserved: number) =>
  new StockItem({
    id: 's1',
    productId: 'p1',
    availableQuantity: available,
    reservedQuantity: reserved,
  });

describe('StockItem', () => {
  it('sellableQuantity = disponible - reservado', () => {
    expect(make(5, 2).sellableQuantity).toBe(3);
  });

  describe('reserve', () => {
    it('reserva una unidad si hay sellable', () => {
      const r = make(5, 2).reserve();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.value.reservedQuantity).toBe(3);
        expect(r.value.availableQuantity).toBe(5);
      }
    });

    it('falla con INSUFFICIENT_STOCK si todo está reservado', () => {
      const r = make(3, 3).reserve();
      expect(r.ok).toBe(false);
      if (!r.ok)
        expect(r.error).toEqual({
          type: 'INSUFFICIENT_STOCK',
          productId: 'p1',
        });
    });

    it('falla con INSUFFICIENT_STOCK si no hay disponible', () => {
      const r = make(0, 0).reserve();
      expect(r.ok).toBe(false);
    });
  });

  describe('confirmSale', () => {
    it('decrementa disponible y reservado', () => {
      const r = make(5, 2).confirmSale();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.value.availableQuantity).toBe(4);
        expect(r.value.reservedQuantity).toBe(1);
      }
    });

    it('falla con NO_RESERVATION si no hay reserva', () => {
      const r = make(5, 0).confirmSale();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.type).toBe('NO_RESERVATION');
    });
  });

  describe('release', () => {
    it('libera una reserva sin tocar disponible', () => {
      const r = make(5, 2).release();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.value.availableQuantity).toBe(5);
        expect(r.value.reservedQuantity).toBe(1);
      }
    });

    it('falla con NO_RESERVATION si no hay reserva', () => {
      const r = make(5, 0).release();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.type).toBe('NO_RESERVATION');
    });
  });

  it('no muta la instancia original (inmutabilidad)', () => {
    const original = make(5, 2);
    original.reserve();
    expect(original.reservedQuantity).toBe(2);
  });
});
