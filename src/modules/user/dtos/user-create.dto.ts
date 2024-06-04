import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { UserProfileCreateDto } from './user-profile-create.dto';

export class UserCreateDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsStrongPassword()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  // @IsEnum(UserApprovalStatus)
  // @IsOptional()
  // approvalStatus: UserApprovalStatus;

  @ValidateNested({ each: true })
  @Type(() => UserProfileCreateDto)
  userProfile: UserProfileCreateDto;
}
