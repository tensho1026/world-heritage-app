import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPracticeAttempts1760000006000 implements MigrationInterface {
  name = 'AddPracticeAttempts1760000006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "learning_exercise_type" AS ENUM ('dictation', 'writing');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_exercise_attempt" (
        "id" SERIAL PRIMARY KEY,
        "heritageSiteId" uuid NOT NULL REFERENCES "world_heritage_site"("uuid") ON DELETE CASCADE,
        "type" "learning_exercise_type" NOT NULL,
        "sourceSentenceEn" text NOT NULL,
        "answerText" text NOT NULL,
        "score" smallint NOT NULL,
        "hintsUsed" smallint NOT NULL DEFAULT 0,
        "playbackCount" smallint NOT NULL DEFAULT 0,
        "completedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_practice_site" ON "learning_exercise_attempt" ("heritageSiteId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_practice_type" ON "learning_exercise_attempt" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_practice_completed" ON "learning_exercise_attempt" ("completedAt")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "learning_exercise_attempt"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "learning_exercise_type"`);
  }
}
