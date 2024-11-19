import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { DriverProfileCreateDto } from '#/modules/user/dtos/driver-profile-create.dto';

export class FranchiseCreateDto {
  @IsString()
  @IsOptional()
  mvFileNo: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  vehicleMake: string;

  @IsString()
  @MinLength(5)
  @MaxLength(25)
  vehicleMotorNo: string;

  @IsString()
  @MinLength(11)
  @MaxLength(17)
  vehicleChassisNo: string;

  @IsString()
  @MinLength(3)
  @MaxLength(7)
  plateNo: string;

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
  ctcCedulaImgUrl: string;

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
}
