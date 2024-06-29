import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

import { DriverProfileCreateDto } from '#/modules/user/dtos/driver-profile-create.dto';

export class FranchiseRenewalCreateDto {
  @IsString()
  vehicleORImgUrl: string;

  @IsString()
  vehicleCRImgUrl: string;

  @IsString()
  todaAssocMembershipImgUrl: string;

  @IsString()
  driverLicenseNoImgUrl: string;

  @IsString()
  brgyClearanceImgUrl: string;

  @IsString()
  @IsOptional()
  voterRegRecordImgUrl: string;

  @IsInt()
  @IsPositive()
  todaAssociationId: number;

  @IsBoolean()
  isDriverOwner: boolean;

  @ValidateNested({ each: true })
  @Type(() => DriverProfileCreateDto)
  @IsOptional()
  driverProfile: DriverProfileCreateDto;

  @IsInt()
  @IsPositive()
  @IsOptional()
  driverProfileId: number;

  @IsInt()
  @IsPositive()
  franchiseId: number;
}
