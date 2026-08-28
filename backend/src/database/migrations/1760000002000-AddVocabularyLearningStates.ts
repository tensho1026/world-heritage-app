import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVocabularyLearningStates1760000002000 implements MigrationInterface {
  name = 'AddVocabularyLearningStates1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" ADD "isInMemorization" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" ADD "isUncertain" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vocabulary_memorization" ON "saved_vocabulary" ("isInMemorization")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vocabulary_uncertain" ON "saved_vocabulary" ("isUncertain")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_vocabulary_uncertain"`);
    await queryRunner.query(`DROP INDEX "IDX_vocabulary_memorization"`);
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" DROP COLUMN "isUncertain"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_vocabulary" DROP COLUMN "isInMemorization"`,
    );
  }
}
