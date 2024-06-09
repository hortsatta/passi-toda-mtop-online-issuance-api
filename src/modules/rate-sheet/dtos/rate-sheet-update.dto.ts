import {
  IsString,
  MaxLength,
  IsOptional,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { FeeType } from '../enums/rate-sheet.enum';
import { RateSheetFeeUpdateDto } from './rate-sheet-fee-update.dto';

export class RateSheetUpdateDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name: string;

  @IsEnum(FeeType)
  @IsOptional()
  feeType: FeeType;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => RateSheetFeeUpdateDto)
  rateSheetFees: RateSheetFeeUpdateDto[];
}
