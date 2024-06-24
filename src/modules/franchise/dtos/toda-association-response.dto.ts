import { Expose, Type } from 'class-transformer';

import { BaseResponse, BaseResponseDto } from '#/common/dtos/base-response.dto';
import { Franchise } from '../entities/franchise.entity';
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
  franchiseCount: number;

  @Expose()
  @Type(() => FranchiseResponseDto)
  franchises: FranchiseResponseDto[];
}

export type TodaAssociationResponse = BaseResponse & {
  name: string;
  authorizedRoute: string;
  presidentFirstName: string;
  presidentLastName: string;
  presidentMiddleName: string;
  franchises?: Franchise[];
  franchiseCount?: number;
};
