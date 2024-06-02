import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;
}
