import { Expose } from 'class-transformer';

export abstract class BaseResponseDto {
  @Expose()
  id: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;
}

export type BaseResponse = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};
