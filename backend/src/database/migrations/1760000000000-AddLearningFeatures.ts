import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLearningFeatures1760000000000 implements MigrationInterface {
  name = 'AddLearningFeatures1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "comprehension_level" AS ENUM('difficult', 'partial', 'understood')`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" ADD "mainImageSourceUrl" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" ADD "mainImageLicense" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" ADD "isFeatured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" ADD "wikipediaImageUrl" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" ADD "wikipediaPageUrl" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" ADD "wikipediaImageFetchedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_world_heritage_featured" ON "world_heritage_site" ("isFeatured")`,
    );
    await queryRunner.query(
      `CREATE TABLE "heritage_view" ("id" SERIAL NOT NULL, "heritageSiteId" uuid NOT NULL, "viewedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_heritage_view" PRIMARY KEY ("id"), CONSTRAINT "FK_heritage_view_site" FOREIGN KEY ("heritageSiteId") REFERENCES "world_heritage_site"("uuid") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_heritage_view_site" ON "heritage_view" ("heritageSiteId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_heritage_view_date" ON "heritage_view" ("viewedAt")`,
    );
    await queryRunner.query(
      `CREATE TABLE "heritage_read" ("id" SERIAL NOT NULL, "heritageSiteId" uuid NOT NULL, "readAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_heritage_read" PRIMARY KEY ("id"), CONSTRAINT "FK_heritage_read_site" FOREIGN KEY ("heritageSiteId") REFERENCES "world_heritage_site"("uuid") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_heritage_read_site" ON "heritage_read" ("heritageSiteId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_heritage_read_date" ON "heritage_read" ("readAt")`,
    );
    await queryRunner.query(
      `CREATE TABLE "heritage_learning_state" ("heritageSiteId" uuid NOT NULL, "comprehensionLevel" "comprehension_level", "isFavorite" boolean NOT NULL DEFAULT false, "isReadLater" boolean NOT NULL DEFAULT false, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_heritage_learning_state" PRIMARY KEY ("heritageSiteId"), CONSTRAINT "FK_heritage_learning_site" FOREIGN KEY ("heritageSiteId") REFERENCES "world_heritage_site"("uuid") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_learning_comprehension" ON "heritage_learning_state" ("comprehensionLevel")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_learning_favorite" ON "heritage_learning_state" ("isFavorite")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_learning_read_later" ON "heritage_learning_state" ("isReadLater")`,
    );
    await queryRunner.query(
      `CREATE TABLE "saved_vocabulary" ("id" SERIAL NOT NULL, "expression" character varying(100) NOT NULL, "normalizedExpression" character varying(100) NOT NULL, "translationJa" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_vocabulary_normalized" UNIQUE ("normalizedExpression"), CONSTRAINT "PK_saved_vocabulary" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vocabulary_source" ("id" SERIAL NOT NULL, "vocabularyId" integer NOT NULL, "heritageSiteId" uuid NOT NULL, "sourceSentenceEn" text NOT NULL, "sectionType" character varying(40) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_vocabulary_source" UNIQUE ("vocabularyId", "heritageSiteId", "sourceSentenceEn"), CONSTRAINT "PK_vocabulary_source" PRIMARY KEY ("id"), CONSTRAINT "FK_vocabulary_source_vocabulary" FOREIGN KEY ("vocabularyId") REFERENCES "saved_vocabulary"("id") ON DELETE CASCADE, CONSTRAINT "FK_vocabulary_source_site" FOREIGN KEY ("heritageSiteId") REFERENCES "world_heritage_site"("uuid") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vocabulary_source_vocabulary" ON "vocabulary_source" ("vocabularyId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vocabulary_source_site" ON "vocabulary_source" ("heritageSiteId")`,
    );
    await queryRunner.query(
      `CREATE TABLE "translation_cache" ("id" SERIAL NOT NULL, "sourceLanguage" character varying(8) NOT NULL, "targetLanguage" character varying(8) NOT NULL, "sourceTextHash" character(64) NOT NULL, "sourceText" text NOT NULL, "translatedText" text NOT NULL, "provider" character varying(20) NOT NULL DEFAULT 'deepl', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_translation_cache" UNIQUE ("sourceLanguage", "targetLanguage", "sourceTextHash", "provider"), CONSTRAINT "PK_translation_cache" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "translation_cache"`);
    await queryRunner.query(`DROP TABLE "vocabulary_source"`);
    await queryRunner.query(`DROP TABLE "saved_vocabulary"`);
    await queryRunner.query(`DROP TABLE "heritage_learning_state"`);
    await queryRunner.query(`DROP TABLE "heritage_read"`);
    await queryRunner.query(`DROP TABLE "heritage_view"`);
    await queryRunner.query(`DROP INDEX "IDX_world_heritage_featured"`);
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" DROP COLUMN "wikipediaImageFetchedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" DROP COLUMN "wikipediaPageUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" DROP COLUMN "wikipediaImageUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" DROP COLUMN "isFeatured"`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" DROP COLUMN "mainImageLicense"`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" DROP COLUMN "mainImageSourceUrl"`,
    );
    await queryRunner.query(`DROP TYPE "comprehension_level"`);
  }
}
