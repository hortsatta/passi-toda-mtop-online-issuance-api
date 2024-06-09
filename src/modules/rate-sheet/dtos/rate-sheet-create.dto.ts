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
import { RateSheetFeeCreateDto } from './rate-sheet-fee-create.dto';

export class RateSheetCreateDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(FeeType)
  feeType: FeeType;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RateSheetFeeCreateDto)
  rateSheetFees: RateSheetFeeCreateDto[];
}
