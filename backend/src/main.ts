import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/http/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');

  app.use(helmet());
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  setupSwagger(app, apiPrefix);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}

function setupSwagger(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
  apiPrefix: string,
): void {
  const config = new DocumentBuilder()
    .setTitle('Checkout Full-Stack API')
    .setDescription(
      'API del checkout de un producto pagado con pasarela de pagos (Sandbox).',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
}

void bootstrap();
