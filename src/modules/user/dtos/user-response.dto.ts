import { Expose, Type } from 'class-transformer';

import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { UserRole, UserApprovalStatus } from '../enums/user.enum';
import { UserProfileResponseDto } from './user-profile-response.dto';

export class UserResponseDto extends BaseResponseDto {
  @Expose()
  role: UserRole;

  @Expose()
  email: string;

  @Expose()
  approvalStatus: UserApprovalStatus;

  @Expose()
  approvalDate: Date;

  @Expose()
  lastSignInDate: Date;

  @Expose()
  @Type(() => UserProfileResponseDto)
  userProfile: UserProfileResponseDto;
}
