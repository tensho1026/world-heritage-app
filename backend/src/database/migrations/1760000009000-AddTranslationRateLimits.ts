import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTranslationRateLimits1760000009000 implements MigrationInterface {
  name = 'AddTranslationRateLimits1760000009000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "translation_rate_limit" (
        "clientKey" char(64) NOT NULL,
        "windowStart" timestamptz NOT NULL,
        "requestCount" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_translation_rate_limit" PRIMARY KEY ("clientKey", "windowStart")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_rate_limit_window" ON "translation_rate_limit" ("windowStart")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "translation_rate_limit"`);
  }
}
