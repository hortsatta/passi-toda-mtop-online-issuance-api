import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { Expose, Type } from 'class-transformer';

import { FeeType } from '../enums/rate-sheet.enum';
import { RateSheetFeeResponseDto } from './rate-sheet-fee-response.dto';

export class RateSheetResponseDto extends BaseResponseDto {
  @Expose()
  name: string;

  @Expose()
  feeType: FeeType;

  @Expose()
  @Type(() => RateSheetFeeResponseDto)
  rateSheetFees: RateSheetFeeResponseDto[];
}
