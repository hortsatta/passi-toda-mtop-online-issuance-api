import { Expose, Type } from 'class-transformer';

import { BaseResponseDto } from '#/common/dtos/base-response.dto';
import { UserCivilStatus, UserGender } from '../enums/user.enum';
import { UserResponseDto } from './user-response.dto';

export class UserProfileResponseDto extends BaseResponseDto {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  middleName: string;

  @Expose()
  birthDate: Date;

  @Expose()
  phoneNumber: string;

  @Expose()
  gender: UserGender;

  @Expose()
  civilStatus: UserCivilStatus;

  @Expose()
  religion: string;

  @Expose()
  address: string;

  @Expose()
  driverLicenseNo: string;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;
}
