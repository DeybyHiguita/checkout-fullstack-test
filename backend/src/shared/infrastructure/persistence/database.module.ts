import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormEntities } from './data-source';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        const isProd = config.get<string>('NODE_ENV') === 'production';
        return {
          type: 'postgres' as const,
          ...(url
            ? { url }
            : {
                host: config.get<string>('DB_HOST'),
                port: config.get<number>('DB_PORT'),
                username: config.get<string>('DB_USER'),
                password: config.get<string>('DB_PASSWORD'),
                database: config.get<string>('DB_NAME'),
              }),
          entities: ormEntities,
          synchronize: config.get<boolean>('DB_SYNCHRONIZE', false),
          // En producción (p. ej. Railway/Render) suele requerirse SSL.
          ssl: isProd ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
