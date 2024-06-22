import { Inject, Injectable } from '@nestjs/common';

import dayjs from '#/common/config/dayjs.config';
import { FranchiseApprovalStatus } from '../franchise/enums/franchise.enum';
import { FranchiseService } from '../franchise/franchise.service';
import { ReportFranchiseIssuance } from './dtos/report-franchise-issuance-response.dto';

@Injectable()
export class ReportService {
  constructor(
    @Inject(FranchiseService)
    private readonly franchiseService: FranchiseService,
  ) {}

  async getFranchiseIssuanceByDateRange(
    fromDate: Date,
    toDate: Date,
  ): Promise<ReportFranchiseIssuance> {
    const franchises = await this.franchiseService.getAllFranchisesByDateRange(
      fromDate,
      toDate,
    );

    const totalApplication = franchises.filter((franchise) =>
      dayjs(franchise.createdAt).isBetween(fromDate, toDate, 'day', '[]'),
    );

    const franchisesWithApprovalDate = franchises.filter(
      (franchise) =>
        franchise.approvalDate != null &&
        dayjs(franchise.approvalDate).isBetween(fromDate, toDate, 'day', '[]'),
    );

    const totalPendingValidationCount = totalApplication.filter(
      (franchise) =>
        franchise.approvalStatus === FranchiseApprovalStatus.PendingValidation,
    ).length;

    const totalPendingPaymentCount = franchisesWithApprovalDate.filter(
      (franchise) =>
        franchise.approvalStatus === FranchiseApprovalStatus.PendingPayment,
    ).length;

    const totalApprovalCount = franchisesWithApprovalDate.filter(
      (franchise) =>
        franchise.approvalStatus === FranchiseApprovalStatus.Approved,
    ).length;

    const totalRejectedCount = franchisesWithApprovalDate.filter(
      (franchise) =>
        franchise.approvalStatus === FranchiseApprovalStatus.Rejected,
    ).length;

    const totalCanceledCount = franchisesWithApprovalDate.filter(
      (franchise) =>
        franchise.approvalStatus === FranchiseApprovalStatus.Canceled,
    ).length;

    return {
      totalApplicationCount: totalApplication.length,
      totalPendingValidationCount,
      totalPendingPaymentCount,
      totalApprovalCount,
      totalRejectedCount,
      totalCanceledCount,
    };
  }
}
