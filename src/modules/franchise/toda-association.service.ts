import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  In,
  ILike,
  FindOptionsOrder,
  FindOptionsOrderValue,
  Not,
} from 'typeorm';

import { TodaAssociation } from './entities/toda-association.entity';
import { TodaAssociationCreateDto } from './dtos/toda-association-create.dto';
import { TodaAssociationUpdateDto } from './dtos/toda-association-update.dto';

@Injectable()
export class TodaAssociationService {
  constructor(
    @InjectRepository(TodaAssociation)
    private readonly todaAssociationRepo: Repository<TodaAssociation>,
  ) {}

  getAllTodaAssociations(
    sort?: string,
    todaAssociationIds?: number[],
    q?: string,
    withFranchise?: boolean,
  ) {
    const generateWhere = () => {
      let baseWhere: FindOptionsWhere<TodaAssociation> = {};

      if (todaAssociationIds?.length) {
        baseWhere = { id: In(todaAssociationIds), ...baseWhere };
      }

      if (q?.trim()) {
        baseWhere = { name: ILike(`%${q}%`), ...baseWhere };
      }

      return baseWhere;
    };

    const generateOrder = (): FindOptionsOrder<TodaAssociation> => {
      if (!sort) {
        return { name: 'ASC' };
      }

      const [sortBy, sortOrder] = sort?.split(',') || [];

      if (sortBy === 'authorizedRoute') {
        return { authorizedRoute: sortOrder as FindOptionsOrderValue };
      }

      return { [sortBy]: sortOrder };
    };

    return this.todaAssociationRepo.find({
      where: generateWhere(),
      order: generateOrder(),
      relations: { franchises: withFranchise },
    });
  }

  getOneById(id: number, withFranchise?: boolean): Promise<TodaAssociation> {
    return this.todaAssociationRepo.findOne({
      where: { id },
      relations: { franchises: withFranchise },
    });
  }

  async create(
    todaAssociationDto: TodaAssociationCreateDto,
  ): Promise<TodaAssociation> {
    const existingAssociation = await this.todaAssociationRepo.findOne({
      where: { name: todaAssociationDto.name },
    });

    if (existingAssociation) {
      throw new BadRequestException('TODA Association name already taken');
    }

    const todaAssociation = this.todaAssociationRepo.create(todaAssociationDto);
    return this.todaAssociationRepo.save(todaAssociation);
  }

  async update(
    todaAssociationDto: TodaAssociationUpdateDto,
    id: number,
  ): Promise<TodaAssociation> {
    const existingTodaAssociation = await this.todaAssociationRepo.findOne({
      where: { id: Not(id), name: todaAssociationDto.name },
    });

    if (existingTodaAssociation) {
      throw new BadRequestException('TODA Association name already taken');
    }

    return this.todaAssociationRepo.save(todaAssociationDto);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.todaAssociationRepo.delete({ id });

    if (!result.affected) {
      throw new NotFoundException('TODA Association not found');
    }

    return !!result.affected;
  }
}
