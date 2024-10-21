import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserPasswordForgotDto {
  @IsEmail()
  email: string;
}

export class UserPasswordResetDto {
  @IsString()
  @IsStrongPassword()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
