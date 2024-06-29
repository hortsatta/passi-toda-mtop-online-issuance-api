import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class FranchiseRenewalUpdateDto {
  @IsString()
  @IsOptional()
  vehicleORImgUrl: string;

  @IsString()
  @IsOptional()
  vehicleCRImgUrl: string;

  @IsString()
  @IsOptional()
  todaAssocMembershipImgUrl: string;

  @IsString()
  @IsOptional()
  driverLicenseNoImgUrl: string;

  @IsString()
  @IsOptional()
  brgyClearanceImgUrl: string;

  @IsString()
  @IsOptional()
  voterRegRecordImgUrl: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  todaAssociationId: number;

  @IsBoolean()
  @IsOptional()
  isDriverOwner: boolean;

  @IsInt()
  @IsPositive()
  @IsOptional()
  driverProfileId: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  franchiseId: number;
}
