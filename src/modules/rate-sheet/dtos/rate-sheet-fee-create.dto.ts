import {
  IsString,
  MaxLength,
  IsInt,
  IsPositive,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class RateSheetFeeCreateDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsBoolean()
  isPenalty: boolean;

  @IsInt()
  @IsOptional()
  activatePenaltyAfterExpiryDays: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  rateSheetId: number;
}
