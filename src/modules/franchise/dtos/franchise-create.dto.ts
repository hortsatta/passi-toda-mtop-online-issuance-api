import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class FranchiseCreateDto {
  @IsString()
  @MinLength(15)
  @MaxLength(15)
  mvFileNo: string;

  @IsString()
  @MinLength(3)
  @MaxLength(7)
  plateNo: string;

  @IsString()
  @MinLength(11)
  @MaxLength(11)
  ownerDriverLicenseNo: string;

  @IsString()
  vehicleORImgUrl: string;

  @IsString()
  vehicleCRImgUrl: string;

  @IsString()
  todaAssocMembershipImgUrl: string;

  @IsString()
  ownerDriverLicenseNoImgUrl: string;

  @IsString()
  brgyClearanceImgUrl: string;

  @IsString()
  @IsOptional()
  voterRegRecordImgUrl: string;

  @IsInt()
  @IsPositive()
  todaAssociationId: number;
}
