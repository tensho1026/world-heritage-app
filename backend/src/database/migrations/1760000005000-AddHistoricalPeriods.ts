import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHistoricalPeriods1760000005000 implements MigrationInterface {
  name = 'AddHistoricalPeriods1760000005000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "world_heritage_site"
      ADD COLUMN IF NOT EXISTS "historicalPeriodStart" integer,
      ADD COLUMN IF NOT EXISTS "historicalPeriodEnd" integer,
      ADD COLUMN IF NOT EXISTS "historicalPeriodLabel" text,
      ADD COLUMN IF NOT EXISTS "historicalPeriodType" varchar(40),
      ADD COLUMN IF NOT EXISTS "historicalPeriodSourceUrl" text,
      ADD COLUMN IF NOT EXISTS "historicalPeriodApproximate" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "historicalPeriodVerified" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_heritage_historical_period_start" ON "world_heritage_site" ("historicalPeriodStart")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_heritage_historical_period_start"`,
    );
    await queryRunner.query(`
      ALTER TABLE "world_heritage_site"
      DROP COLUMN IF EXISTS "historicalPeriodVerified",
      DROP COLUMN IF EXISTS "historicalPeriodApproximate",
      DROP COLUMN IF EXISTS "historicalPeriodSourceUrl",
      DROP COLUMN IF EXISTS "historicalPeriodType",
      DROP COLUMN IF EXISTS "historicalPeriodLabel",
      DROP COLUMN IF EXISTS "historicalPeriodEnd",
      DROP COLUMN IF EXISTS "historicalPeriodStart"
    `);
  }
}
