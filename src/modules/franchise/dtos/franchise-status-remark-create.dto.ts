import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FranchiseStatusRemarkCreateDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  fieldName: string;

  @IsString()
  remark: string;
}
