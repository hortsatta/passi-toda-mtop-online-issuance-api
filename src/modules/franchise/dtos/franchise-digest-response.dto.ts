import { Expose, Type } from 'class-transformer';

import { FranchiseResponseDto } from './franchise-response.dto';

export class FranchiseDigestResponseDto {
  @Expose()
  @Type(() => FranchiseResponseDto)
  pendingValidations: FranchiseResponseDto[];

  @Expose()
  @Type(() => FranchiseResponseDto)
  pendingPayments: FranchiseResponseDto[];

  @Expose()
  @Type(() => FranchiseResponseDto)
  recentApprovals: FranchiseResponseDto[];

  @Expose()
  @Type(() => FranchiseResponseDto)
  recentRejections: FranchiseResponseDto[];
}
