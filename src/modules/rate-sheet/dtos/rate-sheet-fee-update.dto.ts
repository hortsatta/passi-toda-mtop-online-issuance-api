import {
  IsString,
  MaxLength,
  IsInt,
  IsPositive,
  IsOptional,
} from 'class-validator';

export class RateSheetFeeUpdateDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  amount: number;
}
