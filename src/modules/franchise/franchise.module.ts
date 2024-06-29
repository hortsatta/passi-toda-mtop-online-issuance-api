import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { Franchise } from './entities/franchise.entity';
import { FranchiseRenewal } from './entities/franchise-renewal-entity';
import { TodaAssociation } from './entities/toda-association.entity';
import { FranchiseSubscriber } from './subscribers/franchise.subscriber';
import { FranchiseRenewalSubscriber } from './subscribers/franchise-renewal.subscriber';
import { FranchiseController } from './controllers/franchise.controller';
import { FranchiseService } from './services/franchise.service';
import { TodaAssociationService } from './services/toda-association.service';
import { TodaAssociationController } from './controllers/toda-association.controller';
import { FranchiseRenewalController } from './controllers/franchise-renewal.controller';
import { FranchiseRenewalService } from './services/franchise-renewal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Franchise, FranchiseRenewal, TodaAssociation]),
    UserModule,
  ],
  controllers: [
    FranchiseController,
    TodaAssociationController,
    FranchiseRenewalController,
  ],
  providers: [
    FranchiseSubscriber,
    FranchiseRenewalSubscriber,
    FranchiseService,
    TodaAssociationService,
    FranchiseRenewalService,
  ],
  exports: [FranchiseService],
})
export class FranchiseModule {}
