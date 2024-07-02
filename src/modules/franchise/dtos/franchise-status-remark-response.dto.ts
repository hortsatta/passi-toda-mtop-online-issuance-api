import { Expose } from 'class-transformer';

import { BaseResponseDto } from '#/common/dtos/base-response.dto';

export class FranchiseStatusRemarkResponseDto extends BaseResponseDto {
  @Expose()
  fieldName: string;

  @Expose()
  remark: string;
}
