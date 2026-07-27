import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../app.module';

/**
 * Genera docs/openapi.json sin levantar el servidor ni conectar a la BD (preview mode).
 * Uso: npm run docs:openapi
 */
async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Checkout Full-Stack API')
    .setDescription(
      'API del checkout de un producto pagado con pasarela de pagos (Sandbox).',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const outDir = join(__dirname, '..', '..', 'docs');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, 'openapi.json'),
    JSON.stringify(document, null, 2),
  );
  await app.close();
  console.log('OpenAPI exportado a docs/openapi.json');
}

exportOpenApi().catch((error) => {
  console.error(error);
  process.exit(1);
});
