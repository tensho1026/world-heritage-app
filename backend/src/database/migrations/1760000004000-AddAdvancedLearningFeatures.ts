import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdvancedLearningFeatures1760000004000 implements MigrationInterface {
  name = 'AddAdvancedLearningFeatures1760000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" ADD "nextReviewAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" ADD "reviewIntervalDays" double precision NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" ADD "reviewEaseFactor" double precision NOT NULL DEFAULT 2.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" ADD "reviewCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" ADD "lapseCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" ADD "lastReviewedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vocabulary_next_review" ON "saved_vocabulary" ("nextReviewAt")`,
    );
    await queryRunner.query(
      `CREATE TYPE "vocabulary_review_rating" AS ENUM('again', 'hard', 'good')`,
    );
    await queryRunner.query(
      `CREATE TABLE "article_highlight" ("id" SERIAL NOT NULL, "heritageSiteId" uuid NOT NULL, "sectionKey" character varying(120) NOT NULL, "startOffset" integer NOT NULL, "endOffset" integer NOT NULL, "selectedText" text NOT NULL, "noteJa" text NOT NULL DEFAULT '', "difficultyReason" character varying(40), "reasonDetail" text NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_article_highlight_range" UNIQUE ("heritageSiteId", "sectionKey", "startOffset", "endOffset"), CONSTRAINT "PK_article_highlight" PRIMARY KEY ("id"), CONSTRAINT "FK_article_highlight_site" FOREIGN KEY ("heritageSiteId") REFERENCES "world_heritage_site"("uuid") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_article_highlight_site" ON "article_highlight" ("heritageSiteId")`,
    );
    await queryRunner.query(
      `CREATE TABLE "vocabulary_review" ("id" SERIAL NOT NULL, "vocabularyId" integer NOT NULL, "rating" "vocabulary_review_rating" NOT NULL, "previousIntervalDays" double precision NOT NULL, "nextIntervalDays" double precision NOT NULL, "nextReviewAt" TIMESTAMP WITH TIME ZONE NOT NULL, "reviewedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_vocabulary_review" PRIMARY KEY ("id"), CONSTRAINT "FK_vocabulary_review_vocabulary" FOREIGN KEY ("vocabularyId") REFERENCES "saved_vocabulary"("id") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vocabulary_review_vocabulary" ON "vocabulary_review" ("vocabularyId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vocabulary_review_date" ON "vocabulary_review" ("reviewedAt")`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_attempt" ("id" SERIAL NOT NULL, "heritageSiteId" uuid NOT NULL, "score" smallint NOT NULL, "total" smallint NOT NULL, "answers" jsonb NOT NULL DEFAULT '[]'::jsonb, "completedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_quiz_attempt" PRIMARY KEY ("id"), CONSTRAINT "FK_quiz_attempt_site" FOREIGN KEY ("heritageSiteId") REFERENCES "world_heritage_site"("uuid") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_attempt_site" ON "quiz_attempt" ("heritageSiteId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_attempt_date" ON "quiz_attempt" ("completedAt")`,
    );
    await queryRunner.query(
      `CREATE TABLE "comprehension_history" ("id" SERIAL NOT NULL, "heritageSiteId" uuid NOT NULL, "previousLevel" "comprehension_level", "nextLevel" "comprehension_level", "changedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_comprehension_history" PRIMARY KEY ("id"), CONSTRAINT "FK_comprehension_history_site" FOREIGN KEY ("heritageSiteId") REFERENCES "world_heritage_site"("uuid") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_comprehension_history_site" ON "comprehension_history" ("heritageSiteId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_comprehension_history_date" ON "comprehension_history" ("changedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "comprehension_history"`);
    await queryRunner.query(`DROP TABLE "quiz_attempt"`);
    await queryRunner.query(`DROP TABLE "vocabulary_review"`);
    await queryRunner.query(`DROP TABLE "article_highlight"`);
    await queryRunner.query(`DROP TYPE "vocabulary_review_rating"`);
    await queryRunner.query(`DROP INDEX "IDX_vocabulary_next_review"`);
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" DROP COLUMN "lastReviewedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" DROP COLUMN "lapseCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" DROP COLUMN "reviewCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" DROP COLUMN "reviewEaseFactor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" DROP COLUMN "reviewIntervalDays"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" DROP COLUMN "nextReviewAt"`,
    );
  }
}
