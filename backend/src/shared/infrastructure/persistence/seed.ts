import { randomUUID } from 'node:crypto';
import { AppDataSource } from './data-source';
import { ProductOrmEntity } from '../../../modules/products/infrastructure/persistence/product.orm-entity';
import { StockItemOrmEntity } from '../../../modules/stock/infrastructure/persistence/stock-item.orm-entity';

interface SeedProduct {
  name: string;
  description: string;
  priceInCents: number;
  imageUrl: string;
  quantity: number;
}

const PRODUCTS: SeedProduct[] = [
  {
    name: 'Audífonos inalámbricos Pro',
    description:
      'Cancelación activa de ruido, 30h de batería y estuche de carga rápida.',
    priceInCents: 45000000,
    imageUrl: 'https://picsum.photos/seed/headphones/600/600',
    quantity: 12,
  },
  {
    name: 'Teclado mecánico compacto',
    description:
      'Switches silenciosos, retroiluminación RGB y conexión Bluetooth/USB-C.',
    priceInCents: 32000000,
    imageUrl: 'https://picsum.photos/seed/keyboard/600/600',
    quantity: 8,
  },
  {
    name: 'Mouse ergonómico inalámbrico',
    description:
      'Sensor de alta precisión, diseño ergonómico y batería recargable.',
    priceInCents: 18000000,
    imageUrl: 'https://picsum.photos/seed/mouse/600/600',
    quantity: 20,
  },
  {
    name: 'Cámara web 4K',
    description:
      'Video 4K con enfoque automático, micrófono dual y corrección de luz.',
    priceInCents: 27000000,
    imageUrl: 'https://picsum.photos/seed/webcam/600/600',
    quantity: 5,
  },
];

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  const productRepo = AppDataSource.getRepository(ProductOrmEntity);
  const stockRepo = AppDataSource.getRepository(StockItemOrmEntity);

  const existing = await productRepo.count();
  if (existing > 0) {
    console.log(`Seed omitido: ya existen ${existing} productos.`);
    await AppDataSource.destroy();
    return;
  }

  for (const p of PRODUCTS) {
    const productId = randomUUID();
    await productRepo.save(
      productRepo.create({
        id: productId,
        name: p.name,
        description: p.description,
        priceInCents: p.priceInCents,
        currency: 'COP',
        imageUrl: p.imageUrl,
      }),
    );
    await stockRepo.save(
      stockRepo.create({
        id: randomUUID(),
        productId,
        availableQuantity: p.quantity,
        reservedQuantity: 0,
      }),
    );
    console.log(`  + ${p.name} (stock: ${p.quantity})`);
  }

  console.log(`Seed completado: ${PRODUCTS.length} productos.`);
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('Error en el seed:', error);
  process.exit(1);
});
