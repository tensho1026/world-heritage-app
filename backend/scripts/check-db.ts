import 'dotenv/config';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../src/database/typeorm.options';

type VersionRow = {
  now: string;
  version: string;
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  const dataSource = new DataSource(createDataSourceOptions(databaseUrl, false));

  await dataSource.initialize();

  const rows = (await dataSource.query(
    'select now() as now, version() as version',
  )) as VersionRow[];
  const firstRow = rows[0];

  console.log('Neon connection ok');
  console.log(`Server time: ${firstRow.now}`);
  console.log(`PostgreSQL: ${firstRow.version.split(',')[0]}`);

  await dataSource.destroy();
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
