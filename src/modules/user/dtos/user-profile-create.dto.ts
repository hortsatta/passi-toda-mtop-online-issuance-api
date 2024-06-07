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

  @IsString()
  @MaxLength(50)
  @IsOptional()
  middleName: string;

  @IsString()
  @MinLength(11)
  @MaxLength(11)
  @IsOptional()
  driverLicenseNo: string;
}
