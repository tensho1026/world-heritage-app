import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMonthlyChallenges1760000007000 implements MigrationInterface {
  name = 'AddMonthlyChallenges1760000007000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "challenge_metric" AS ENUM (
          'unique_sites', 'new_countries', 'filtered_reads',
          'vocabulary_saved', 'vocabulary_reviews', 'quiz_attempts',
          'dictation_attempts', 'writing_attempts'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "monthly_challenge" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(120) NOT NULL,
        "month" char(7) NOT NULL,
        "metric" "challenge_metric" NOT NULL,
        "target" integer NOT NULL,
        "filters" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "note" text NOT NULL DEFAULT '',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_challenge_month" ON "monthly_challenge" ("month")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_challenge_month_metric" ON "monthly_challenge" ("month", "metric")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "monthly_challenge"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "challenge_metric"`);
  }
}
