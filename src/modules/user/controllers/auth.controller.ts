import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';

import { UseSerializeInterceptor } from '#/common/interceptors/serialize.interceptor';
import { AuthService } from '../services/auth.service';
import { AuthSignInDto } from '../dtos/auth-sign-in.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/sign-in')
  @UseSerializeInterceptor(AuthResponseDto)
  signIn(@Body() authSignInDto: AuthSignInDto) {
    return this.authService.signIn(authSignInDto);
  }

  @Get('/register/confirm')
  async confirmEmail(@Query('token') token: string): Promise<boolean> {
    return this.authService.confirmRegistrationEmail(token);
  }
}
