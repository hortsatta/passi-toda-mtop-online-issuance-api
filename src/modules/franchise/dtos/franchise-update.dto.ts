import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class FranchiseUpdateDto {
  @IsString()
  @MinLength(15)
  @MaxLength(15)
  mvFileNo: string;

  @IsString()
  @MinLength(3)
  @MaxLength(7)
  @IsOptional()
  plateNo: string;

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
}
