import { IsString, MaxLength, IsOptional, IsEnum } from 'class-validator';

import { ApprovingSignaturePosition } from '../enums/franchise.enum';

export class ApprovingAuthorityCreateDto {
  @IsString()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MaxLength(50)
  lastName: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  middleName: string;

  @IsString()
  @MaxLength(225)
  positionName: string;

  @IsString()
  @MaxLength(225)
  @IsOptional()
  departmentName: string;

  @IsEnum(ApprovingSignaturePosition)
  signaturePosition: ApprovingSignaturePosition;
}
