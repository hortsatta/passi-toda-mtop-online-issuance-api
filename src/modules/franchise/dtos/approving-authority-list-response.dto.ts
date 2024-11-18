import { Expose, Type } from 'class-transformer';

import { ApprovingAuthorityResponseDto } from './approving-authority-response.dto';

export class ApprovingAuthorityListResponseDto {
  @Expose()
  @Type(() => ApprovingAuthorityResponseDto)
  currentAuthorities: ApprovingAuthorityResponseDto[];
}
