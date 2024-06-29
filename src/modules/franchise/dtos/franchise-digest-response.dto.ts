import { Expose, Type } from 'class-transformer';

import {
  FranchiseResponse,
  FranchiseResponseDto,
} from './franchise-response.dto';

export class FranchiseDigestResponseDto {
  @Expose()
  @Type(() => FranchiseResponseDto)
  pendingValidations: FranchiseResponseDto[];

  @Expose()
  @Type(() => FranchiseResponseDto)
  validatedList: FranchiseResponseDto[];

  @Expose()
  @Type(() => FranchiseResponseDto)
  paidList: FranchiseResponseDto[];

  @Expose()
  @Type(() => FranchiseResponseDto)
  recentApprovals: FranchiseResponseDto[];

  @Expose()
  @Type(() => FranchiseResponseDto)
  recentRejections: FranchiseResponseDto[];
}

export type FranchiseDigest = {
  pendingValidations: FranchiseResponse[];
  validatedList: FranchiseResponse[];
  paidList: FranchiseResponse[];
  recentApprovals: FranchiseResponse[];
  recentRejections: FranchiseResponse[];
};
