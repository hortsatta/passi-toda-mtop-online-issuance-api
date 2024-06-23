import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { Franchise } from './entities/franchise.entity';
import { TodaAssociation } from './entities/toda-association.entity';
import { FranchiseSubscriber } from './subscribers/franchise.subscriber';
import { FranchiseController } from './controllers/franchise.controller';
import { FranchiseService } from './services/franchise.service';
import { TodaAssociationService } from './services/toda-association.service';
import { TodaAssociationController } from './controllers/toda-association.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Franchise, TodaAssociation]), UserModule],
  controllers: [FranchiseController, TodaAssociationController],
  providers: [FranchiseSubscriber, FranchiseService, TodaAssociationService],
  exports: [FranchiseService],
})
export class FranchiseModule {}
