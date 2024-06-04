import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { Franchise } from './entities/franchise.entity';
import { TodaAssociation } from './entities/toda-association.entity';
import { FranchiseSubscriber } from './subscribers/franchise.subscriber';
import { FranchiseController } from './franchise.controller';
import { FranchiseService } from './franchise.service';
import { TodaAssociationService } from './toda-association.service';
import { TodaAssociationController } from './toda-association.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Franchise, TodaAssociation]), UserModule],
  controllers: [FranchiseController, TodaAssociationController],
  providers: [FranchiseSubscriber, FranchiseService, TodaAssociationService],
})
export class FranchiseModule {}
