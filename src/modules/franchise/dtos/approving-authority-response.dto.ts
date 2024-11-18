import { Expose } from 'class-transformer';

import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { ApprovingSignaturePosition } from '../enums/franchise.enum';

export class ApprovingAuthorityResponseDto extends BaseResponseDto {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  middleName: string;

  @Expose()
  positionName: string;

  @Expose()
  departmentName: string;

  @Expose()
  signaturePosition: ApprovingSignaturePosition;
}
