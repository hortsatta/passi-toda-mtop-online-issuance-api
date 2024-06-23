import { Expose, Type } from 'class-transformer';

import { Franchise } from '../entities/franchise.entity';
import { FranchiseResponseDto } from './franchise-response.dto';

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
  pendingValidations: Franchise[];
  validatedList: Franchise[];
  paidList: Franchise[];
  recentApprovals: Franchise[];
  recentRejections: Franchise[];
};
