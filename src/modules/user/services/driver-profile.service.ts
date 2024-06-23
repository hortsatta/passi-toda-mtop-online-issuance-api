import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsOrderValue,
  FindOptionsWhere,
  ILike,
  In,
  Repository,
} from 'typeorm';

import { DriverProfile } from '../entities/driver-profile.entity';
import { DriverProfileCreateDto } from '../dtos/driver-profile-create.dto';

@Injectable()
export class DriverProfileService {
  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepo: Repository<DriverProfile>,
  ) {}

  getAllDriverProfilesByMemberId(
    memberId: number,
    sort?: string,
    driverProfileIds?: number[],
    q?: string,
    withFranchise?: boolean,
  ): Promise<DriverProfile[]> {
    const generateWhere = () => {
      let baseWhere: FindOptionsWhere<DriverProfile> = {
        user: { id: memberId },
      };

      if (driverProfileIds?.length) {
        baseWhere = { id: In(driverProfileIds), ...baseWhere };
      }

      if (q?.trim()) {
        return [
          { firstName: ILike(`%${q}%`), ...baseWhere },
          { lastName: ILike(`%${q}%`), ...baseWhere },
          { middleName: ILike(`%${q}%`), ...baseWhere },
        ];
      }

      return baseWhere;
    };

    const generateOrder = (): FindOptionsOrder<DriverProfile> => {
      if (!sort) {
        return { firstName: 'ASC' };
      }

      const [sortBy, sortOrder] = sort?.split(',') || [];

      if (sortBy === 'lastName') {
        return { lastName: sortOrder as FindOptionsOrderValue };
      }

      return { [sortBy]: sortOrder };
    };

    return this.driverProfileRepo.find({
      where: generateWhere(),
      order: generateOrder(),
      relations: { franchises: withFranchise },
    });
  }

  getOneById(id: number, memberId?: number): Promise<DriverProfile> {
    const where = memberId ? { id, user: { id: memberId } } : { id };
    return this.driverProfileRepo.findOne({
      where,
      relations: {
        user: true,
      },
    });
  }

  async create(
    driverProfileDto: DriverProfileCreateDto,
    memberId: number,
  ): Promise<DriverProfile> {
    const driverProfile = this.driverProfileRepo.create({
      ...driverProfileDto,
      user: { id: memberId },
    });

    return this.driverProfileRepo.save(driverProfile);
  }
}
