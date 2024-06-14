import { Expose, Type } from 'class-transformer';

import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { UserProfileSafeResponseDto } from './user-profile-safe-response.dto';

export class UserSafeResponseDto extends BaseResponseDto {
  @Expose()
  email: string;

  @Expose()
  @Type(() => UserProfileSafeResponseDto)
  userProfile: UserProfileSafeResponseDto;
}
