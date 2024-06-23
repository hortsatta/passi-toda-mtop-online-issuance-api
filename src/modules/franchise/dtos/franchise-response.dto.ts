import { Expose, Type } from 'class-transformer';

import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { UserSafeResponseDto } from '#/modules/user/dtos/user-safe-response.dto';
import { DriverProfileResponseDto } from '#/modules/user/dtos/driver-profile-response.dto';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { TodaAssociationResponseDto } from './toda-association-response.dto';

export class FranchiseResponseDto extends BaseResponseDto {
  @Expose()
  mvFileNo: string;

  @Expose()
  plateNo: string;

  @Expose()
  vehicleORImgUrl: string;

  @Expose()
  vehicleCRImgUrl: string;

  @Expose()
  todaAssocMembershipImgUrl: string;

  @Expose()
  driverLicenseNoImgUrl: string;

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
  isDriverOwner: boolean;

  @Expose()
  @Type(() => TodaAssociationResponseDto)
  todaAssociation: TodaAssociationResponseDto;

  @Expose()
  @Type(() => DriverProfileResponseDto)
  driverProfile: DriverProfileResponseDto;

  @Expose()
  @Type(() => UserSafeResponseDto)
  user: UserSafeResponseDto;
}
