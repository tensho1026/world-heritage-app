import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJapaneseHeritageTranslations1760000008000 implements MigrationInterface {
  name = 'AddJapaneseHeritageTranslations1760000008000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "world_heritage_site"
        ADD COLUMN IF NOT EXISTS "nameJa" text,
        ADD COLUMN IF NOT EXISTS "shortDescriptionJa" text,
        ADD COLUMN IF NOT EXISTS "descriptionJa" text,
        ADD COLUMN IF NOT EXISTS "justificationJa" text,
        ADD COLUMN IF NOT EXISTS "dangerListJa" text,
        ADD COLUMN IF NOT EXISTS "criteriaTextJa" text,
        ADD COLUMN IF NOT EXISTS "statesNamesJa" text[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS "regionJa" varchar(200),
        ADD COLUMN IF NOT EXISTS "mainImageCaptionJa" text,
        ADD COLUMN IF NOT EXISTS "mainVideoCaptionJa" text,
        ADD COLUMN IF NOT EXISTS "translationSourceHashes" jsonb NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS "translationProvider" varchar(40),
        ADD COLUMN IF NOT EXISTS "translatedAt" timestamptz
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "world_heritage_site"
        DROP COLUMN IF EXISTS "translatedAt",
        DROP COLUMN IF EXISTS "translationProvider",
        DROP COLUMN IF EXISTS "translationSourceHashes",
        DROP COLUMN IF EXISTS "mainVideoCaptionJa",
        DROP COLUMN IF EXISTS "mainImageCaptionJa",
        DROP COLUMN IF EXISTS "regionJa",
        DROP COLUMN IF EXISTS "statesNamesJa",
        DROP COLUMN IF EXISTS "criteriaTextJa",
        DROP COLUMN IF EXISTS "dangerListJa",
        DROP COLUMN IF EXISTS "justificationJa",
        DROP COLUMN IF EXISTS "descriptionJa",
        DROP COLUMN IF EXISTS "shortDescriptionJa",
        DROP COLUMN IF EXISTS "nameJa"
    `);
  }
}
