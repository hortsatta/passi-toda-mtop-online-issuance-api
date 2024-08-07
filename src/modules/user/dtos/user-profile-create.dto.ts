import {
  IsString,
  MaxLength,
  IsOptional,
  IsDate,
  MaxDate,
  IsPhoneNumber,
  IsEnum,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

import dayjs from '#/common/config/dayjs.config';
import { UserCivilStatus, UserGender } from '../enums/user.enum';

export class UserProfileCreateDto {
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
  @Length(11, 11)
  @IsOptional()
  driverLicenseNo: string;
}
