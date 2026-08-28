import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWikipediaAttribution1760000003000 implements MigrationInterface {
  name = 'AddWikipediaAttribution1760000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" ADD "wikipediaImageAuthor" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" ADD "wikipediaImageLicense" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" DROP COLUMN "wikipediaImageLicense"`,
    );
    await queryRunner.query(
      `ALTER TABLE "world_heritage_site" DROP COLUMN "wikipediaImageAuthor"`,
    );
  }
}
