import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule as NestjsMailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    NestjsMailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get<string>('MAILER_USER_EMAIL'),
            pass: configService.get<string>('MAILER_USER_PASSWORD'), // or app-specific password
          },
        },
        defaults: {
          from: '"No Reply" <no-reply@gmail.com>',
        },
        template: {
          dir: join(__dirname, '..', 'common/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
})
export class MailerModule {}
