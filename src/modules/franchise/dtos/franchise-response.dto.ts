import { Expose, Type } from 'class-transformer';

import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { UserResponseDto } from '#/modules/user/dtos/user-response.dto';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { TodaAssociationResponseDto } from './toda-association-response.dto';

export class FranchiseResponseDto extends BaseResponseDto {
  @Expose()
  mvFileNo: string;

  @Expose()
  plateNo: string;

  @Expose()
  ownerDriverLicenseNo: string;

  @Expose()
  vehicleORImgUrl: string;

  @Expose()
  vehicleCRImgUrl: string;

  @Expose()
  todaAssocMembershipImgUrl: string;

  @Expose()
  ownerDriverLicenseNoImgUrl: string;

  @Expose()
  brgyClearanceImgUrl: string;

  @Expose()
  voterRegRecordImgUrl: string;

  @Expose()
  approvalStatus: FranchiseApprovalStatus;

  @Expose()
  approvalDate: Date;

  @Expose()
  expiryDate: Date;

  @Expose()
  @Type(() => TodaAssociationResponseDto)
  todaAssociation: TodaAssociationResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;
}
