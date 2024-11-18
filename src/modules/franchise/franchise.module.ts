import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { Franchise } from './entities/franchise.entity';
import { FranchiseRenewal } from './entities/franchise-renewal.entity';
import { TodaAssociation } from './entities/toda-association.entity';
// import { ApprovingAuthority } from './entities/approving-authority.entity';
import { FranchiseSubscriber } from './subscribers/franchise.subscriber';
import { FranchiseRenewalSubscriber } from './subscribers/franchise-renewal.subscriber';
import { FranchiseController } from './controllers/franchise.controller';
import { FranchiseService } from './services/franchise.service';
import { TodaAssociationService } from './services/toda-association.service';
import { TodaAssociationController } from './controllers/toda-association.controller';
import { FranchiseRenewalController } from './controllers/franchise-renewal.controller';
import { FranchiseRenewalService } from './services/franchise-renewal.service';
import { FranchiseStatusRemark } from './entities/franchise-status-remark.entity';
// import { ApprovingAuthorityController } from './controllers/approving-authority.controller';
// import { ApprovingAuthorityService } from './services/approving-authority.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Franchise,
      FranchiseRenewal,
      FranchiseStatusRemark,
      TodaAssociation,
      // ApprovingAuthority,
    ]),
    UserModule,
  ],
  controllers: [
    FranchiseController,
    TodaAssociationController,
    FranchiseRenewalController,
    // ApprovingAuthorityController,
  ],
  providers: [
    FranchiseSubscriber,
    FranchiseRenewalSubscriber,
    FranchiseService,
    FranchiseRenewalService,
    TodaAssociationService,
    // ApprovingAuthorityService,
  ],
  exports: [FranchiseService],
})
export class FranchiseModule {}
