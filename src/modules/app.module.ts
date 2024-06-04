import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database.module';
import { UserModule } from './user/user.module';
import { FranchiseModule } from './franchise/franchise.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    DatabaseModule,
    UserModule,
    FranchiseModule,
  ],
  controllers: [],
})
export class AppModule {}
