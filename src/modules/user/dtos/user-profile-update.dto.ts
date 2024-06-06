import {
  IsString,
  MaxLength,
  IsOptional,
  IsDate,
  MaxDate,
  IsPhoneNumber,
  IsEnum,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import dayjs from '#/common/config/dayjs.config';
import { UserGender } from '../enums/user.enum';

export class UserProfileUpdateDto {
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

  @Type(() => Date)
  @IsDate()
  @MaxDate(dayjs().toDate())
  @IsOptional()
  birthDate: Date;

  @IsPhoneNumber('PH')
  @MaxLength(11)
  @IsOptional()
  phoneNumber: string;

  @IsEnum(UserGender)
  @IsOptional()
  gender: UserGender;

  @IsString()
  @MinLength(11)
  @MaxLength(11)
  @IsOptional()
  driverLicenseNo: string;
}
