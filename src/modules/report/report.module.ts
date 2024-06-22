import { Module } from '@nestjs/common';

import { FranchiseModule } from '../franchise/franchise.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [FranchiseModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
