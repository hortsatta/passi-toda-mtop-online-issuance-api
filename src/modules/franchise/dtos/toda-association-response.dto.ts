import { Expose, Type } from 'class-transformer';

import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { FranchiseResponseDto } from './franchise-response.dto';

export class TodaAssociationResponseDto extends BaseResponseDto {
  @Expose()
  name: string;

  @Expose()
  authorizedRoute: string;

  @Expose()
  presidentFirstName: string;

  @Expose()
  presidentLastName: string;

  @Expose()
  presidentMiddleName: string;

  @Expose()
  @Type(() => FranchiseResponseDto)
  franchises: FranchiseResponseDto[];
}
