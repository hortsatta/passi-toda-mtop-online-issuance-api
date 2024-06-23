import { Expose } from 'class-transformer';

export class ReportFranchiseIssuanceResponseDto {
  @Expose()
  totalApplicationCount: number;

  @Expose()
  totalPendingValidationCount: number;

  @Expose()
  totalValidatedCount: number;

  @Expose()
  totalPaidCount: number;

  @Expose()
  totalApprovalCount: number;

  @Expose()
  totalRejectedCount: number;

  @Expose()
  totalCanceledCount: number;
}

export type ReportFranchiseIssuance = {
  totalApplicationCount: number;
  totalPendingValidationCount: number;
  totalValidatedCount: number;
  totalPaidCount: number;
  totalApprovalCount: number;
  totalRejectedCount: number;
  totalCanceledCount: number;
};
