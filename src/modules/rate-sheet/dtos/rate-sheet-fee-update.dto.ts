import {
  IsString,
  MaxLength,
  IsInt,
  IsPositive,
  IsOptional,
  IsBoolean,
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

  @IsBoolean()
  @IsOptional()
  isPenalty: boolean;

  @IsInt()
  @IsOptional()
  activatePenaltyAfterExpiryDays: number;
}
