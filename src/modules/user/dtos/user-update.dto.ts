import {
  IsString,
  IsStrongPassword,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { UserApprovalStatus } from '../enums/user.enum';
import { UserProfileUpdateDto } from './user-profile-update.dto';

export class UserUpdateDto {
  @IsString()
  @IsStrongPassword()
  @MinLength(8)
  @MaxLength(100)
  @IsOptional()
  password: string;

  @IsEnum(UserApprovalStatus)
  @IsOptional()
  approvalStatus: UserApprovalStatus;

  @ValidateNested({ each: true })
  @Type(() => UserProfileUpdateDto)
  @IsOptional()
  userProfile: UserProfileUpdateDto;
}
