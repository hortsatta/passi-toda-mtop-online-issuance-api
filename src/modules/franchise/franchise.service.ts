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
  IsNull,
  MoreThanOrEqual,
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

  async validateCreateFranchise(
    franchiseDto: FranchiseCreateDto,
    memberId: number,
  ) {
    const { mvFileNo, plateNo, todaAssociationId } = franchiseDto;

    const existingFranchise = await this.franchiseRepo.findOne({
      where: [{ mvFileNo }, { plateNo }],
      relations: { user: true },
    });

    const todaAssociation = await this.todaAssociationRepo.findOne({
      where: { id: todaAssociationId },
    });

    if (existingFranchise?.user.id === memberId) {
      throw new BadRequestException('Vehicle already exist');
    }

    if (
      existingFranchise?.approvalStatus === FranchiseApprovalStatus.Approved ||
      existingFranchise?.approvalStatus ===
        FranchiseApprovalStatus.PendingPayment
    ) {
      throw new BadRequestException('Vehicle already registered');
    } else if (!todaAssociation) {
      throw new BadRequestException('TODA Association not found');
    }
  }

  async validateUpdateFranchise(id: number, memberId: number) {
    // Find franchise, throw error if none found
    const franchise = await this.franchiseRepo.findOne({
      where: {
        id,
        approvalStatus: FranchiseApprovalStatus.PendingValidation,
        user: { id: memberId },
        todaAssociation: { id: Not(IsNull()) },
      },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    const baseWhere = {
      id: Not(id),
      approvalStatus: In([
        FranchiseApprovalStatus.PendingPayment,
        FranchiseApprovalStatus.Approved,
      ]),
    };

    const existingFranchise = await this.franchiseRepo.findOne({
      where: [
        { mvFileNo: franchise.mvFileNo, ...baseWhere },
        { plateNo: franchise.plateNo, ...baseWhere },
      ],
    });

    if (existingFranchise) {
      throw new BadRequestException('Vehicle already registered');
    }
  }

  // TODO get paginated

  getAllFranchises(
    sort?: string,
    franchiseIds?: number[],
    q?: string,
    status?: string,
    take?: number,
    startDate?: Date,
  ): Promise<Franchise[]> {
    const generateWhere = () => {
      let baseWhere: FindOptionsWhere<Franchise> = {};

      if (franchiseIds?.length) {
        baseWhere = { ...baseWhere, id: In(franchiseIds) };
      }

      if (status?.trim()) {
        baseWhere = { ...baseWhere, approvalStatus: In(status.split(',')) };
      }

      if (startDate) {
        baseWhere = { ...baseWhere, createdAt: MoreThanOrEqual(startDate) };
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

    const takeOptions = !!take
      ? {
          take,
          skip: 0,
        }
      : {};

    return this.franchiseRepo.find({
      where: generateWhere(),
      order: generateOrder(),
      ...takeOptions,
      relations: { todaAssociation: true, user: true },
    });
  }

  getAllFranchisesByMemberId(
    memberId: number,
    sort?: string,
    franchiseIds?: number[],
    q?: string,
    status?: string,
    take?: number,
  ): Promise<Franchise[]> {
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

    const takeOptions = !!take
      ? {
          take,
          skip: 0,
        }
      : {};

    return this.franchiseRepo.find({
      where: generateWhere(),
      order: generateOrder(),
      ...takeOptions,
      relations: { todaAssociation: true },
    });
  }

  getOneById(id: number, memberId?: number): Promise<Franchise> {
    const where = memberId ? { id, user: { id: memberId } } : { id };
    return this.franchiseRepo.findOne({
      where,
      relations: { user: true, todaAssociation: true },
    });
  }

  async validateUpsert(
    franchiseDto: FranchiseCreateDto | FranchiseUpdateDto,
    memberId: number,
    id?: number,
  ): Promise<boolean> {
    if (!id) {
      await this.validateCreateFranchise(
        franchiseDto as FranchiseCreateDto,
        memberId,
      );
    } else {
      await this.validateUpdateFranchise(id, memberId);
    }

    return true;
  }

  async create(
    franchiseDto: FranchiseCreateDto,
    memberId: number,
  ): Promise<Franchise> {
    const {
      mvFileNo: targetMvFileNo,
      plateNo: targetPlateNo,
      ownerDriverLicenseNo: targetOwnerDriverLicenseNo,
      todaAssociationId,
      ...moreFranchiseDto
    } = franchiseDto;

    await this.validateCreateFranchise(franchiseDto, memberId);

    const mvFileNo = targetMvFileNo.toLowerCase();
    const plateNo = targetPlateNo.toLowerCase();
    const ownerDriverLicenseNo = targetOwnerDriverLicenseNo.toLowerCase();

    const franchise = this.franchiseRepo.create({
      ...moreFranchiseDto,
      mvFileNo,
      plateNo,
      ownerDriverLicenseNo,
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
    const {
      mvFileNo: targetMvFileNo,
      plateNo: targetPlateNo,
      ownerDriverLicenseNo: targetOwnerDriverLicenseNo,
      todaAssociationId,
      ...moreFranchiseDto
    } = franchiseDto;

    await this.validateUpdateFranchise(id, memberId);

    const franchise = await this.franchiseRepo.findOne({
      where: { id, user: { id: memberId } },
    });

    const mvFileNo = targetMvFileNo?.toLowerCase();
    const plateNo = targetPlateNo?.toLowerCase();
    const ownerDriverLicenseNo = targetOwnerDriverLicenseNo?.toLowerCase();

    return this.franchiseRepo.save({
      ...franchise,
      ...moreFranchiseDto,
      ...(mvFileNo && { mvFileNo }),
      ...(plateNo && { plateNo }),
      ...(ownerDriverLicenseNo && { ownerDriverLicenseNo }),
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
      switch (franchise.approvalStatus) {
        case FranchiseApprovalStatus.PendingValidation:
          updatedApprovalStatus = FranchiseApprovalStatus.PendingPayment;
          break;
        case FranchiseApprovalStatus.PendingPayment:
          updatedApprovalStatus = FranchiseApprovalStatus.Approved;
          break;
      }
    }

    await this.franchiseRepo.save({
      ...franchise,
      approvalStatus: updatedApprovalStatus,
    });

    return this.franchiseRepo.findOne({
      where: { id },
      relations: { todaAssociation: true, user: true },
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
