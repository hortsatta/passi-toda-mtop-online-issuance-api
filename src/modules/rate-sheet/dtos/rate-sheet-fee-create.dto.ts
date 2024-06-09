import {
  IsString,
  MaxLength,
  IsInt,
  IsPositive,
  IsOptional,
} from 'class-validator';

export class RateSheetFeeCreateDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  rateSheetId: number;
}
