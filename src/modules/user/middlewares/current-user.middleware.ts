import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';

import { UserService } from '../services/user.service';

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async use(
    req: FastifyRequest['raw'],
    _: FastifyReply['raw'],
    next: () => void,
  ) {
    // Get cookie and parse token and verify token using jwtService
    const token = req.headers.authorization?.split(' ').pop();
    if (token) {
      try {
        const auth: any = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        }) as JwtPayload;
        // Get current user by email and add to request object
        const user = await this.userService.findOneByEmail(auth.email);
        (req as any).currentUser = user;
      } catch (error) {
        (req as any).currentUser = null;
      }
    }

    return next();
  }
}
