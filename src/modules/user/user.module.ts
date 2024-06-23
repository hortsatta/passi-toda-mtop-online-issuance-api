import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { CurrentUserMiddleware } from './middlewares/current-user.middleware';
import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/user.entity';
import { DriverProfile } from './entities/driver-profile.entity';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';
import { DriverProfileController } from './controllers/driver-profile.controller';
import { UserSubscriber } from './subscribers/user.subscriber';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { DriverProfileService } from './services/driver-profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, DriverProfile]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [UserController, AuthController, DriverProfileController],
  providers: [UserSubscriber, UserService, AuthService, DriverProfileService],
  exports: [UserService, DriverProfileService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes('*');
  }
}
