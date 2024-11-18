import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { User } from './user/entities/user.entity';
import { UserProfile } from './user/entities/user-profile.entity';
import { DriverProfile } from './user/entities/driver-profile.entity';
import { Franchise } from './franchise/entities/franchise.entity';
import { FranchiseRenewal } from './franchise/entities/franchise-renewal.entity';
import { FranchiseStatusRemark } from './franchise/entities/franchise-status-remark.entity';
import { TodaAssociation } from './franchise/entities/toda-association.entity';
// import { ApprovingAuthority } from './franchise/entities/approving-authority.entity';
import { RateSheet } from './rate-sheet/entities/rate-sheet.entity';
import { RateSheetFee } from './rate-sheet/entities/rate-sheet-fee.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        let ssl: object | boolean = false;
        // Fetch pem file for aws rds db in prod
        if (process.env.NODE_ENV === 'production') {
          ssl = {
            rejectUnauthorized: false,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST'),
          port: configService.get<number>('DATABASE_PORT'),
          username: configService.get<string>('DATABASE_USERNAME'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          database: configService.get<string>('DATABASE_NAME'),
          // Use snake_case for databse column names
          namingStrategy: new SnakeNamingStrategy(),
          entities: [
            User,
            UserProfile,
            DriverProfile,
            Franchise,
            FranchiseRenewal,
            FranchiseStatusRemark,
            TodaAssociation,
            // ApprovingAuthority,
            RateSheet,
            RateSheetFee,
          ],
          synchronize: process.env.NODE_ENV !== 'production',
          ssl,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
