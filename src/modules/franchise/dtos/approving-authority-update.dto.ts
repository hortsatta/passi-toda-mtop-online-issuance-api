import { IsString, MaxLength, IsOptional, IsEnum } from 'class-validator';

import { ApprovingSignaturePosition } from '../enums/franchise.enum';

export class ApprovingAuthorityUpdateDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  firstName: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  lastName: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  middleName: string;

  @IsString()
  @MaxLength(225)
  @IsOptional()
  positionName: string;

  @IsString()
  @MaxLength(225)
  @IsOptional()
  departmentName: string;

  @IsEnum(ApprovingSignaturePosition)
  @IsOptional()
  signaturePosition: ApprovingSignaturePosition;
}
