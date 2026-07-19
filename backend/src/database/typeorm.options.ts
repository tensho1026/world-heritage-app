import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { WorldHeritageSite } from '../world-heritage-site.entity';

type SharedPostgresOptions = {
  type: 'postgres';
  url: string;
  entities: [typeof WorldHeritageSite];
  synchronize: boolean;
  ssl: true;
  extra?: {
    enableChannelBinding?: boolean;
  };
};

function createSharedPostgresOptions(
  databaseUrl: string,
  synchronize: boolean,
): SharedPostgresOptions {
  const enableChannelBinding = databaseUrl.includes('channel_binding=require');

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [WorldHeritageSite],
    synchronize,
    ssl: true,
    extra: enableChannelBinding ? { enableChannelBinding: true } : undefined,
  };
}

export function createTypeOrmModuleOptions(
  databaseUrl: string,
  synchronize: boolean,
): TypeOrmModuleOptions {
  return {
    ...createSharedPostgresOptions(databaseUrl, synchronize),
    autoLoadEntities: true,
  };
}

export function createDataSourceOptions(
  databaseUrl: string,
  synchronize: boolean,
): DataSourceOptions {
  return createSharedPostgresOptions(databaseUrl, synchronize) as DataSourceOptions;
}
