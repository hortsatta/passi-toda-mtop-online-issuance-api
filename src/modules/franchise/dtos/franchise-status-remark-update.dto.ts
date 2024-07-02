import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FranchiseStatusRemarkUpdateDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  fieldName: string;

  @IsString()
  @IsOptional()
  remark: string;
}
