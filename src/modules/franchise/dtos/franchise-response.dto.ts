import { Expose, Type } from 'class-transformer';

import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { UserSafeResponseDto } from '#/modules/user/dtos/user-safe-response.dto';
import { DriverProfileResponseDto } from '#/modules/user/dtos/driver-profile-response.dto';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { Franchise } from '../entities/franchise.entity';
import { TodaAssociationResponseDto } from './toda-association-response.dto';
import { FranchiseRenewalResponseDto } from './franchise-renewal-response.dto';
import { FranchiseStatusRemarkResponseDto } from './franchise-status-remark-response.dto';

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
  ctcCedulaImgUrl: string;

  @Expose()
  voterRegRecordImgUrl: string;

  @Expose()
  approvalStatus: FranchiseApprovalStatus;

  @Expose()
  approvalDate: Date;

  @Expose()
  expiryDate: Date;

  @Expose()
  isExpired: boolean;

  @Expose()
  canRenew: boolean;

  @Expose()
  paymentORNo: string;

  @Expose()
  @Type(() => TodaAssociationResponseDto)
  todaAssociation: TodaAssociationResponseDto;

  @Expose()
  isDriverOwner: boolean;

  @Expose()
  @Type(() => DriverProfileResponseDto)
  driverProfile: DriverProfileResponseDto;

  @Expose()
  @Type(() => FranchiseStatusRemarkResponseDto)
  franchiseStatusRemarks: FranchiseStatusRemarkResponseDto[];

  @Expose()
  @Type(() => FranchiseRenewalResponseDto)
  franchiseRenewals: FranchiseRenewalResponseDto[];

  @Expose()
  @Type(() => UserSafeResponseDto)
  user: UserSafeResponseDto;
}

export type FranchiseResponse = Franchise & {
  isExpired: boolean;
  canRenew: boolean;
};
