import { Expose } from 'class-transformer';

export class ReportFranchiseIssuanceResponseDto {
  @Expose()
  totalApplicationCount: number;

  @Expose()
  totalPendingValidationCount: number;

  @Expose()
  totalPendingPaymentCount: number;

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
  totalPendingPaymentCount: number;
  totalApprovalCount: number;
  totalRejectedCount: number;
  totalCanceledCount: number;
};
