import { Type } from 'class-transformer';
import {
  IsEmail,
  MaxLength,
  IsOptional,
  IsString,
  IsDate,
  MaxDate,
  IsPhoneNumber,
  IsEnum,
  MinLength,
} from 'class-validator';

import dayjs from '#/common/config/dayjs.config';
import { UserCivilStatus, UserGender } from '../enums/user.enum';

export class DriverProfileCreateDto {
  @IsEmail()
  @MaxLength(255)
  @IsOptional()
  email: string;

  @IsString()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MaxLength(50)
  lastName: string;

  @Type(() => Date)
  @IsDate()
  @MaxDate(dayjs().toDate())
  birthDate: Date;

  @IsPhoneNumber('PH')
  @MaxLength(11)
  phoneNumber: string;

  @IsEnum(UserGender)
  gender: UserGender;

  @IsEnum(UserCivilStatus)
  civilStatus: UserCivilStatus;

  @IsString()
  @MaxLength(255)
  religion: string;

  @IsString()
  address: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  middleName: string;

  @IsString()
  @MinLength(11)
  @MaxLength(11)
  driverLicenseNo: string;
}
