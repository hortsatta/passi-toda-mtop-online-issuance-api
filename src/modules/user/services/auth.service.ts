import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import dayjs from '#/common/config/dayjs.config';
import { validatePassword } from '../helpers/password.helper';
import { UserApprovalStatus } from '../enums/user.enum';
import { User } from '../entities/user.entity';
import { AuthSignInDto } from '../dtos/auth-sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(authSignInDto: AuthSignInDto): Promise<{
    accessToken: string;
    user: User;
  }> {
    const { email, password } = authSignInDto;
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || user.approvalStatus !== UserApprovalStatus.Approved) {
      throw new UnauthorizedException('Email does not exist');
    } else if (!(await validatePassword(password, user.password))) {
      throw new UnauthorizedException('Password is incorrect');
    }

    // Update last login date field
    this.userRepo.save({
      ...user,
      lastSignInDate: dayjs().toDate(),
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email,
    });

    return {
      accessToken,
      user,
    };
  }

  async confirmRegistrationEmail(token: string): Promise<boolean> {
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    const email = decoded.email;
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || user.approvalStatus !== UserApprovalStatus.Pending) {
      throw new BadRequestException('Cannot confirm email');
    }

    await this.userRepo.save({
      ...user,
      approvalStatus: UserApprovalStatus.Approved,
    });

    return true;
  }

  // TODO last logoutdate
  // async signOut(jwtToken: string): Promise<boolean> {
  //   this.jwtService.
  // }
}
