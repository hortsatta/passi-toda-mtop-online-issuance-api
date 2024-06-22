import { BadRequestException, Controller, Get, Query } from '@nestjs/common';

import dayjs from '#/common/config/dayjs.config';
import { UseSerializeInterceptor } from '#/common/interceptors/serialize.interceptor';
import { UserRole } from '../user/enums/user.enum';
import { UseAuthGuard } from '../user/guards/auth.guard';
import {
  ReportFranchiseIssuance,
  ReportFranchiseIssuanceResponseDto,
} from './dtos/report-franchise-issuance-response.dto';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('/franchises')
  @UseAuthGuard([UserRole.Admin, UserRole.Issuer])
  @UseSerializeInterceptor(ReportFranchiseIssuanceResponseDto)
  async getFranchiseIssuanceByDateRange(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ReportFranchiseIssuance> {
    if (!startDate || !endDate) {
      throw new BadRequestException('Invalid date range');
    }

    const transformedStartDate = dayjs(
      dayjs(startDate).format('YYYY-MM-DD'),
    ).toDate();

    const transformedEndDate = dayjs(
      dayjs(endDate).format('YYYY-MM-DD'),
    ).toDate();

    return this.reportService.getFranchiseIssuanceByDateRange(
      transformedStartDate,
      transformedEndDate,
    );
  }
}
