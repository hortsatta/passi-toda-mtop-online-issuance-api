import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthSignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
