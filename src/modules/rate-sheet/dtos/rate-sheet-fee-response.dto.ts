import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { Expose, Type } from 'class-transformer';

import { RateSheetFee } from '../entities/rate-sheet-fee.entity';
import { RateSheetResponseDto } from './rate-sheet-response.dto';

export class RateSheetFeeResponseDto extends BaseResponseDto {
  @Expose()
  name: string;

  @Expose()
  amount: number;

  @Expose()
  isPenalty: boolean;

  @Expose()
  activatePenaltyAfterExpiryDays: number;

  @Expose()
  isPenaltyActive?: boolean;

  @Expose()
  @Type(() => RateSheetResponseDto)
  rateSheet: RateSheetResponseDto;
}

export type RateSheetFeeResponse = RateSheetFee & {
  isPenaltyActive?: boolean;
};
