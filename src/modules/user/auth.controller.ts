import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { UseSerializeInterceptor } from '#/common/interceptors/serialize.interceptor';
import { AuthService } from './auth.service';
import { AuthSignInDto } from './dtos/auth-sign-in.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/sign-in')
  @UseSerializeInterceptor(AuthResponseDto)
  signIn(@Body() authSignInDto: AuthSignInDto) {
    return this.authService.signIn(authSignInDto);
  }
}
