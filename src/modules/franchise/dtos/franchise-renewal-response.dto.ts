import { Expose, Type } from 'class-transformer';

import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { DriverProfileResponseDto } from '#/modules/user/dtos/driver-profile-response.dto';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { TodaAssociationResponseDto } from './toda-association-response.dto';
import { FranchiseResponseDto } from './franchise-response.dto';
import { FranchiseStatusRemarkResponseDto } from './franchise-status-remark-response.dto';

export class FranchiseRenewalResponseDto extends BaseResponseDto {
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
  @Type(() => FranchiseResponseDto)
  franchise: FranchiseResponseDto;
}
