import { MigrationInterface, QueryRunner } from 'typeorm';
import { FEATURED_UNESCO_IDS } from '../featured-unesco-ids';

export class SeedFeaturedSites1760000001000 implements MigrationInterface {
  name = 'SeedFeaturedSites1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "world_heritage_site" SET "isFeatured" = true WHERE "unescoId" = ANY($1::varchar[])`,
      [FEATURED_UNESCO_IDS],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "world_heritage_site" SET "isFeatured" = false WHERE "unescoId" = ANY($1::varchar[])`,
      [FEATURED_UNESCO_IDS],
    );
  }
}
