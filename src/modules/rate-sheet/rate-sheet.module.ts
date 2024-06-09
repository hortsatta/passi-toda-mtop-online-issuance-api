import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FranchiseModule } from '../franchise/franchise.module';
import { RateSheetController } from './rate-sheet.controller';
import { RateSheetService } from './rate-sheet.service';
import { RateSheet } from './entities/rate-sheet.entity';
import { RateSheetFee } from './entities/rate-sheet-fee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RateSheet, RateSheetFee]),
    FranchiseModule,
  ],
  controllers: [RateSheetController],
  providers: [RateSheetService],
})
export class RateSheetModule {}
