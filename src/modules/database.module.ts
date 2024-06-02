import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import cfetch from 'cross-fetch';

import { User } from './user/entities/user.entity';
import { UserProfile } from './user/entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        let ssl: object | boolean = false;
        // Fetch pem file for aws rds db in prod
        if (process.env.NODE_ENV === 'production') {
          const pemUrl = configService.get<string>('DATABASE_PEM_URL');
          const response = await cfetch(pemUrl);
          const ca = await response.text();
          ssl = {
            rejectUnauthorized: false,
            ca,
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
          entities: [User, UserProfile],
          synchronize: process.env.NODE_ENV !== 'production',
          ssl,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
