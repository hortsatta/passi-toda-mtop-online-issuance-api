import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  Equal,
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';

import { DriverProfileService } from '#/modules/user/services/driver-profile.service';
import {
  getExpiryStatus,
  transformFranchises,
} from '../helpers/franchise.helper';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { Franchise } from '../entities/franchise.entity';
import { TodaAssociation } from '../entities/toda-association.entity';
import { FranchiseCreateDto } from '../dtos/franchise-create.dto';
import { FranchiseUpdateDto } from '../dtos/franchise-update.dto';
import { FranchiseResponse } from '../dtos/franchise-response.dto';

@Injectable()
export class FranchiseService {
  constructor(
    @InjectRepository(Franchise)
    private readonly franchiseRepo: Repository<Franchise>,
    @InjectRepository(TodaAssociation)
    private readonly todaAssociationRepo: Repository<TodaAssociation>,
    @Inject(DriverProfileService)
    private readonly driverProfileService: DriverProfileService,
  ) {}

  async validateCreateFranchise(
    franchiseDto: FranchiseCreateDto,
    memberId: number,
  ) {
    const {
      mvFileNo,
      plateNo,
      todaAssociationId,
      driverProfileId,
      driverProfile,
      isDriverOwner,
    } = franchiseDto;

    const existingFranchise = await this.franchiseRepo.findOne({
      where: [{ mvFileNo }, { plateNo }],
      relations: { user: true },
    });

    const todaAssociation = await this.todaAssociationRepo.findOne({
      where: { id: todaAssociationId },
    });

    if (!isDriverOwner && driverProfileId != null) {
      const driverProfile = await this.driverProfileService.getOneById(
        driverProfileId,
        memberId,
      );

      if (!driverProfile) {
        throw new BadRequestException('Driver does not exist');
      }
    } else if (driverProfileId == null && driverProfile == null) {
      throw new BadRequestException('Driver is required');
    }

    if (existingFranchise?.user.id === memberId) {
      throw new BadRequestException('Vehicle already exist');
    }

    if (
      existingFranchise?.approvalStatus === FranchiseApprovalStatus.Approved ||
      existingFranchise?.approvalStatus === FranchiseApprovalStatus.Paid ||
      existingFranchise?.approvalStatus === FranchiseApprovalStatus.Validated
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
        FranchiseApprovalStatus.Validated,
        FranchiseApprovalStatus.Paid,
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

  async getAllFranchises(
    sort?: string,
    franchiseIds?: number[],
    q?: string,
    status?: string,
    take?: number,
    startDate?: Date,
  ): Promise<FranchiseResponse[]> {
    const generateWhere = () => {
      let baseWhere: FindOptionsWhere<Franchise> = {};

      if (franchiseIds?.length) {
        baseWhere = { ...baseWhere, id: In(franchiseIds) };
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

    const franchises = await this.franchiseRepo.find({
      where: generateWhere(),
      order: generateOrder(),
      ...takeOptions,
      relations: {
        user: true,
        driverProfile: true,
        todaAssociation: true,
        franchiseRenewals: { driverProfile: true, todaAssociation: true },
      },
    });

    let transformedFranchises = transformFranchises(
      franchises,
    ) as FranchiseResponse[];

    if (status?.trim()) {
      transformedFranchises = transformedFranchises.filter((franchise: any) => {
        const target = franchise.franchiseRenewals.length
          ? franchise.franchiseRenewals[0]
          : franchise;

        const statuses = status.split(',');

        return statuses.some((status) => status === target.approvalStatus);
      });
    }

    if (startDate) {
      transformedFranchises = transformedFranchises.filter((franchise: any) => {
        const target = franchise.franchiseRenewals.length
          ? franchise.franchiseRenewals[0]
          : franchise;

        return target.createdAt.valueOf() >= startDate.valueOf();
      });
    }

    return transformedFranchises;
  }

  async getAllFranchisesByMemberId(
    memberId: number,
    sort?: string,
    franchiseIds?: number[],
    q?: string,
    status?: string,
    take?: number,
  ): Promise<FranchiseResponse[]> {
    const generateWhere = () => {
      let baseWhere: FindOptionsWhere<Franchise> = {
        user: { id: memberId },
      };

      if (franchiseIds?.length) {
        baseWhere = { ...baseWhere, id: In(franchiseIds) };
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

    const franchises = await this.franchiseRepo.find({
      where: generateWhere(),
      order: generateOrder(),
      ...takeOptions,
      relations: {
        todaAssociation: true,
        driverProfile: true,
        franchiseRenewals: { todaAssociation: true, driverProfile: true },
      },
    });

    let transformedFranchises = transformFranchises(
      franchises,
    ) as FranchiseResponse[];

    if (status?.trim()) {
      transformedFranchises = transformedFranchises.filter((franchise: any) => {
        const target = franchise.franchiseRenewals.length
          ? franchise.franchiseRenewals[0]
          : franchise;

        const statuses = status.split(',');

        return statuses.some((status) => status === target.approvalStatus);
      });
    }

    return transformedFranchises;
  }

  async getAllFranchisesByDateRange(
    startDate: Date,
    endDate: Date,
    statuses?: FranchiseApprovalStatus[],
  ): Promise<FranchiseResponse[]> {
    const generateWhere = () => {
      if (
        statuses?.length &&
        statuses.every(
          (status) => status !== FranchiseApprovalStatus.PendingValidation,
        )
      ) {
        return {
          approvalDate: Between(startDate, endDate),
        };
      }

      return [
        {
          createdAt: Between(startDate, endDate),
        },
        {
          approvalDate: Between(startDate, endDate),
        },
      ];
    };

    const franchises = await this.franchiseRepo.find({
      where: generateWhere(),
      order: { createdAt: 'ASC' },
      relations: {
        user: true,
        driverProfile: true,
        todaAssociation: true,
        franchiseRenewals: { todaAssociation: true, driverProfile: true },
      },
    });

    const transformedFranchises = transformFranchises(
      franchises,
    ) as FranchiseResponse[];

    if (
      statuses?.length &&
      statuses.every(
        (status) => status !== FranchiseApprovalStatus.PendingValidation,
      )
    ) {
      return transformedFranchises.filter((franchise) => {
        const target = franchise.franchiseRenewals.length
          ? franchise.franchiseRenewals[0]
          : franchise;

        return (
          target.approvalDate.valueOf() >= startDate.valueOf() &&
          target.approvalDate.valueOf() <= endDate.valueOf()
        );
      });
    } else {
      return transformedFranchises.filter((franchise) => {
        const target = franchise.franchiseRenewals.length
          ? franchise.franchiseRenewals[0]
          : franchise;

        return (
          (target.createdAt.valueOf() >= startDate.valueOf() &&
            target.createdAt.valueOf() <= endDate.valueOf()) ||
          (target.approvalDate.valueOf() >= startDate.valueOf() &&
            target.approvalDate.valueOf() <= endDate.valueOf())
        );
      });
    }
  }

  async getOneById(id: number, memberId?: number): Promise<FranchiseResponse> {
    const where = memberId ? { id, user: { id: memberId } } : { id };

    const franchise = await this.franchiseRepo.findOne({
      where,
      relations: {
        user: true,
        driverProfile: true,
        todaAssociation: true,
        franchiseRenewals: { todaAssociation: true, driverProfile: true },
      },
    });

    if (!franchise) throw new NotFoundException('Franchise not found');

    return transformFranchises(franchise) as FranchiseResponse;
  }

  async getOneByIdAsTreasurer(id: number): Promise<FranchiseResponse> {
    const franchise = await this.franchiseRepo.findOne({
      where: { id },
      relations: {
        user: true,
        driverProfile: true,
        todaAssociation: true,
        franchiseRenewals: { todaAssociation: true, driverProfile: true },
      },
    });

    if (!franchise) throw new NotFoundException('Franchise not found');

    const transformedFranchise = transformFranchises(
      franchise,
    ) as FranchiseResponse;

    const target = !transformedFranchise.franchiseRenewals.length
      ? transformedFranchise
      : transformedFranchise.franchiseRenewals[0];

    if (
      target.approvalStatus !== FranchiseApprovalStatus.Validated &&
      target.approvalStatus !== FranchiseApprovalStatus.Paid
    ) {
      return null;
    }

    return transformedFranchise;
  }

  async checkOneByMvPlateNo(mvPlateNo: string): Promise<FranchiseResponse> {
    const baseWhere: FindOptionsWhere<FranchiseResponse> = {
      approvalStatus: Not(
        In([
          FranchiseApprovalStatus.Canceled,
          FranchiseApprovalStatus.Rejected,
        ]),
      ),
    };

    const where = [
      { mvFileNo: Equal(mvPlateNo), ...baseWhere },
      { plateNo: Equal(mvPlateNo), ...baseWhere },
    ];

    const franchise = await this.franchiseRepo.findOne({
      where,
      relations: {
        user: true,
        driverProfile: true,
        todaAssociation: true,
        franchiseRenewals: { todaAssociation: true, driverProfile: true },
      },
    });

    if (!franchise) throw new NotFoundException('Franchise not found');

    const transformedFranchise = transformFranchises(franchise);

    return transformedFranchise as FranchiseResponse;
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
  ): Promise<FranchiseResponse> {
    const {
      mvFileNo: targetMvFileNo,
      plateNo: targetPlateNo,
      todaAssociationId,
      driverProfile: newDriverProfile,
      driverProfileId,
      isDriverOwner,
      ...moreFranchiseDto
    } = franchiseDto;

    await this.validateCreateFranchise(franchiseDto, memberId);

    const mvFileNo = targetMvFileNo.toLowerCase();
    const plateNo = targetPlateNo.toLowerCase();

    let driverProfile = null;

    if (!isDriverOwner) {
      if (driverProfileId != null) {
        driverProfile = { id: driverProfileId };
      } else if (newDriverProfile != null) {
        driverProfile = await this.driverProfileService.create(
          newDriverProfile,
          memberId,
        );
      }
    }

    const franchise = this.franchiseRepo.create({
      ...moreFranchiseDto,
      mvFileNo,
      plateNo,
      todaAssociation: { id: todaAssociationId },
      isDriverOwner,
      driverProfile,
      user: { id: memberId },
    });

    const newFranchise = await this.franchiseRepo.save(franchise);

    return { ...newFranchise, canRenew: false, isExpired: false };
  }

  async update(
    franchiseDto: FranchiseUpdateDto,
    id: number,
    memberId: number,
  ): Promise<FranchiseResponse> {
    const {
      mvFileNo: targetMvFileNo,
      plateNo: targetPlateNo,
      todaAssociationId,
      ...moreFranchiseDto
    } = franchiseDto;

    await this.validateUpdateFranchise(id, memberId);

    const franchise = await this.franchiseRepo.findOne({
      where: { id, user: { id: memberId } },
    });

    const mvFileNo = targetMvFileNo?.toLowerCase();
    const plateNo = targetPlateNo?.toLowerCase();

    const updatedFranchise = await this.franchiseRepo.save({
      ...franchise,
      ...moreFranchiseDto,
      ...(mvFileNo && { mvFileNo }),
      ...(plateNo && { plateNo }),
      todaAssociation: { id: todaAssociationId },
    });

    const expiryStatus = getExpiryStatus(updatedFranchise.expiryDate);

    return { ...updatedFranchise, ...expiryStatus };
  }

  async setApprovalStatus(
    id: number,
    approvalStatus?: FranchiseApprovalStatus,
  ): Promise<FranchiseResponse> {
    const franchise = await this.franchiseRepo.findOne({
      where: { id },
      relations: { franchiseRenewals: true },
    });
    // Return error if user row does not exist
    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    } else if (franchise.franchiseRenewals.length) {
      throw new BadRequestException('Cannot set franchise status');
    }

    let updatedApprovalStatus = approvalStatus;

    if (!approvalStatus) {
      switch (franchise.approvalStatus) {
        case FranchiseApprovalStatus.PendingValidation:
          updatedApprovalStatus = FranchiseApprovalStatus.Validated;
          break;
        case FranchiseApprovalStatus.Validated:
          updatedApprovalStatus = FranchiseApprovalStatus.Paid;
          break;
        case FranchiseApprovalStatus.Paid:
          updatedApprovalStatus = FranchiseApprovalStatus.Approved;
          break;
      }
    }

    await this.franchiseRepo.save({
      ...franchise,
      approvalStatus: updatedApprovalStatus,
    });

    const updatedFranchise = await this.franchiseRepo.findOne({
      where: { id },
      relations: {
        user: true,
        driverProfile: true,
        todaAssociation: true,
      },
    });

    const expiryStatus = getExpiryStatus(updatedFranchise.approvalDate);

    return { ...updatedFranchise, ...expiryStatus };
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
