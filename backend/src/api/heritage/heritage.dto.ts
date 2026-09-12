import { IsEnum, IsIn, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { ComprehensionLevel } from '../../database/entities/heritage-learning-state.entity';

export class RandomHeritageQueryDto {
  @IsOptional()
  @IsIn(['all', 'famous'])
  mode?: 'all' | 'famous';

  @IsOptional()
  @IsUUID()
  exclude?: string;
}

export class UpdateComprehensionDto {
  @ValidateIf((_object, value) => value !== null)
  @IsEnum(ComprehensionLevel)
  comprehensionLevel: ComprehensionLevel | null;
}
