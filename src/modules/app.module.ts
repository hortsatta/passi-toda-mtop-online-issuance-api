import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database.module';
import { UserModule } from './user/user.module';
import { FranchiseModule } from './franchise/franchise.module';
import { CoreModule } from './core/core.module';
import { UploadModule } from './upload/upload.module';
import { RateSheetModule } from './rate-sheet/rate-sheet.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    DatabaseModule,
    CoreModule,
    UserModule,
    FranchiseModule,
    UploadModule,
    RateSheetModule,
    ReportModule,
  ],
  controllers: [],
})
export class AppModule {}
