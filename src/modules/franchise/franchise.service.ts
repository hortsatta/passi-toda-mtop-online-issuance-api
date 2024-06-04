import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  In,
  Not,
  Repository,
} from 'typeorm';

import { FranchiseApprovalStatus } from './enums/franchise.enum';
import { Franchise } from './entities/franchise.entity';
import { TodaAssociation } from './entities/toda-association.entity';
import { FranchiseCreateDto } from './dtos/franchise-create.dto';
import { FranchiseUpdateDto } from './dtos/franchise-update.dto';

@Injectable()
export class FranchiseService {
  constructor(
    @InjectRepository(Franchise)
    private readonly franchiseRepo: Repository<Franchise>,
    @InjectRepository(TodaAssociation)
    private readonly todaAssociationRepo: Repository<TodaAssociation>,
  ) {}

  // TODO get paginated

  getAllFranchisesByMemberId(
    memberId: number,
    sort?: string,
    franchiseIds?: number[],
    q?: string,
    status?: string,
  ) {
    const generateWhere = () => {
      let baseWhere: FindOptionsWhere<Franchise> = {
        user: { id: memberId },
      };

      if (franchiseIds?.length) {
        baseWhere = { ...baseWhere, id: In(franchiseIds) };
      }

      if (status?.trim()) {
        baseWhere = { ...baseWhere, approvalStatus: In(status.split(',')) };
      }

      if (q?.trim()) {
        return [
          { plateNo: ILike(`%${q}%`), ...baseWhere },
          { mvFileNo: ILike(`%${q}%`), ...baseWhere },
        ];
      }

      return baseWhere;
    };

    const generateOrder = (): FindOptionsOrder<Franchise> => {
      if (!sort) {
        return { plateNo: 'ASC' };
      }

      const [sortBy, sortOrder] = sort?.split(',') || [];

      // if (sortBy === 'scheduleDate') {
      //   return { schedules: { startDate: sortOrder as FindOptionsOrderValue } };
      // }

      return { [sortBy]: sortOrder };
    };

    return this.franchiseRepo.find({
      where: generateWhere(),
      order: generateOrder(),
      relations: { todaAssociation: true },
    });
  }

  getAllFranchisesByMvPlateNo(
    mvPlateNo: string,
    status?: string,
    memberId?: number,
  ) {
    const generateWhere = () => {
      let baseWhere: FindOptionsWhere<Franchise> = {};

      if (memberId) {
        baseWhere = { ...baseWhere, user: { id: memberId } };
      }

      if (status?.trim()) {
        baseWhere = { ...baseWhere, approvalStatus: In(status.split(',')) };
      }

      return [
        { plateNo: ILike(`%${mvPlateNo}%`), ...baseWhere },
        { mvFileNo: ILike(`%${mvPlateNo}%`), ...baseWhere },
      ];
    };

    return this.franchiseRepo.find({
      where: generateWhere(),
      order: { plateNo: 'ASC' },
      relations: { user: true, todaAssociation: true },
    });
  }

  getOneById(id: number, memberId?: number): Promise<Franchise> {
    const where = memberId ? { id, user: { id: memberId } } : { id };
    return this.franchiseRepo.findOne({
      where,
      relations: { user: true, todaAssociation: true },
    });
  }

  async create(
    franchiseDto: FranchiseCreateDto,
    memberId: number,
  ): Promise<Franchise> {
    const { mvFileNo, plateNo, todaAssociationId, ...moreFranchiseDto } =
      franchiseDto;

    const existingFranchise = await this.franchiseRepo.findOne({
      where: [{ mvFileNo }, { plateNo }],
    });

    const todaAssociation = await this.todaAssociationRepo.findOne({
      where: { id: todaAssociationId },
    });

    if (existingFranchise.approvalStatus === FranchiseApprovalStatus.Approved) {
      throw new BadRequestException('Vehicle already registered');
    } else if (!todaAssociation) {
      throw new BadRequestException('TODA Association not found');
    }

    const franchise = this.franchiseRepo.create({
      ...moreFranchiseDto,
      mvFileNo,
      plateNo,
      todaAssociation: { id: todaAssociationId },
      user: { id: memberId },
    });

    return this.franchiseRepo.save(franchise);
  }

  async update(
    franchiseDto: FranchiseUpdateDto,
    id: number,
    memberId: number,
  ): Promise<Franchise> {
    const { todaAssociationId, ...moreFranchiseDto } = franchiseDto;
    // Find franchise, throw error if none found
    const franchise = await this.franchiseRepo.findOne({
      where: { id, user: { id: memberId } },
    });

    const todaAssociation = await this.todaAssociationRepo.findOne({
      where: { id: todaAssociationId },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    } else if (!todaAssociation) {
      throw new BadRequestException('TODA Association not found');
    } else if (
      franchise.approvalStatus !== FranchiseApprovalStatus.PendingValidation
    ) {
      throw new BadRequestException('Cannot update registered franchise');
    }

    const existingFranchise = await this.franchiseRepo.findOne({
      where: [
        { mvFileNo: franchise.mvFileNo, id: Not(id) },
        { plateNo: franchise.plateNo, id: Not(id) },
      ],
    });

    if (
      existingFranchise?.approvalStatus === FranchiseApprovalStatus.Approved
    ) {
      throw new BadRequestException('Vehicle already registered');
    }

    return this.franchiseRepo.save({
      ...moreFranchiseDto,
      todaAssociation: { id: todaAssociationId },
    });
  }

  async setApprovalStatus(
    id: number,
    approvalStatus?: FranchiseApprovalStatus,
  ): Promise<Franchise> {
    const franchise = await this.franchiseRepo.findOne({ where: { id } });
    // Return error if user row does not exist
    if (!franchise) throw new NotFoundException('Franchise not found');

    let updatedApprovalStatus = approvalStatus;

    if (!approvalStatus) {
      switch (approvalStatus) {
        case FranchiseApprovalStatus.PendingValidation:
          updatedApprovalStatus = FranchiseApprovalStatus.PendingPayment;
          break;
        case FranchiseApprovalStatus.PendingPayment:
          updatedApprovalStatus = FranchiseApprovalStatus.Approved;
          break;
      }
    }

    return this.franchiseRepo.save({
      ...franchise,
      approvalStatus: updatedApprovalStatus,
    });
  }

  async delete(id: number, memberId: number): Promise<boolean> {
    const franchise = await this.getOneById(id, memberId);

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    } else if (franchise.approvalStatus === FranchiseApprovalStatus.Approved) {
      throw new BadRequestException('Cannot delete registered franchise');
    }

    const result = await this.franchiseRepo.delete({ id });
    return !!result.affected;
  }
}
