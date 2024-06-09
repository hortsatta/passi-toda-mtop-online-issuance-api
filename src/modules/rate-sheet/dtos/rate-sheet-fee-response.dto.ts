import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { Expose, Type } from 'class-transformer';

import { RateSheetResponseDto } from './rate-sheet-response.dto';

export class RateSheetFeeResponseDto extends BaseResponseDto {
  @Expose()
  name: string;

  @Expose()
  amount: number;

  @Expose()
  @Type(() => RateSheetResponseDto)
  rateSheet: RateSheetResponseDto;
}
