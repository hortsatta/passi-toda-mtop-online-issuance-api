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
  Length,
} from 'class-validator';

import dayjs from '#/common/config/dayjs.config';
import { UserCivilStatus, UserGender } from '../enums/user.enum';

export class DriverProfileUpdateDto {
  @IsEmail()
  @MaxLength(255)
  @IsOptional()
  email: string;

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

  @IsEnum(UserCivilStatus)
  @IsOptional()
  civilStatus: UserCivilStatus;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  religion: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @Length(11, 11)
  @IsOptional()
  driverLicenseNo: string;
}
