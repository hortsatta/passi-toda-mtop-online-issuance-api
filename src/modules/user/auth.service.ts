import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { validatePassword } from './helpers/password.helper';
import { UserApprovalStatus } from './enums/user.enum';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { AuthSignInDto } from './dtos/auth-sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(authSignInDto: AuthSignInDto): Promise<{
    accessToken: string;
    user: User;
  }> {
    const { email, password } = authSignInDto;
    const user = await this.userService.findOneByEmail(email);

    if (!user || user.approvalStatus !== UserApprovalStatus.Approved) {
      throw new UnauthorizedException('Email does not exist');
    } else if (!(await validatePassword(password, user.password))) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email,
    });

    return {
      accessToken,
      user,
    };
  }
}
