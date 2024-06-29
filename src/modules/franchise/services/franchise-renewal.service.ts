import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';

import dayjs from '#/common/config/dayjs.config';
import { DriverProfileService } from '#/modules/user/services/driver-profile.service';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { Franchise } from '../entities/franchise.entity';
import { FranchiseRenewal } from '../entities/franchise-renewal-entity';
import { TodaAssociation } from '../entities/toda-association.entity';
import { FranchiseRenewalCreateDto } from '../dtos/franchise-renewal-create.dto';
import { FranchiseRenewalUpdateDto } from '../dtos/franchise-renewal-update.dto';
import {
  ENABLE_RENEW_AFTER_EXPIRY_DAYS,
  ENABLE_RENEW_BEFORE_EXPIRY_DAYS,
} from '../config/franchise.config';

@Injectable()
export class FranchiseRenewalService {
  constructor(
    @InjectRepository(FranchiseRenewal)
    private readonly franchiseRenewalRepo: Repository<FranchiseRenewal>,
    @InjectRepository(Franchise)
    private readonly franchiseRepo: Repository<Franchise>,
    @InjectRepository(TodaAssociation)
    private readonly todaAssociationRepo: Repository<TodaAssociation>,
    @Inject(DriverProfileService)
    private readonly driverProfileService: DriverProfileService,
  ) {}

  async validateCreateFranchiseRenewal(
    franchiseRenewalDto: FranchiseRenewalCreateDto,
    memberId: number,
  ) {
    const currentDate = dayjs();

    const { driverProfileId, driverProfile, isDriverOwner, franchiseId } =
      franchiseRenewalDto;

    const franchise = await this.franchiseRepo.findOne({
      where: { id: franchiseId },
    });

    if (!franchise) {
      throw new BadRequestException('Franchise does not exist');
    } else if (franchise.approvalStatus !== FranchiseApprovalStatus.Approved) {
      throw new BadRequestException('Franchise not yet approved');
    }

    const franchiseRenewal = await this.franchiseRenewalRepo.findOne({
      where: { franchise: { id: franchiseId } },
      order: { createdAt: 'DESC' },
    });

    if (
      franchiseRenewal &&
      franchiseRenewal.approvalStatus !== FranchiseApprovalStatus.Approved
    ) {
      throw new BadRequestException('Franchise renewal ongoing');
    }

    const target = franchiseRenewal || franchise;

    if (
      !currentDate.isBetween(
        dayjs(target.expiryDate).subtract(ENABLE_RENEW_BEFORE_EXPIRY_DAYS, 'd'),
        dayjs(target.expiryDate).add(ENABLE_RENEW_AFTER_EXPIRY_DAYS, 'd'),
        'day',
        '[]',
      )
    ) {
      throw new BadRequestException('Cannot renew franchise');
    }

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
  }

  async validateUpdateFranchiseRenewal(id: number, memberId: number) {
    // Find franchise renewal, throw error if none found
    const franchiseRenewal = await this.franchiseRenewalRepo.findOne({
      where: {
        id,
        franchise: { user: { id: memberId } },
        todaAssociation: { id: Not(IsNull()) },
      },
    });

    if (!franchiseRenewal) {
      throw new NotFoundException('Franchise renewal not found');
    }

    if (
      franchiseRenewal.approvalStatus === FranchiseApprovalStatus.Validated ||
      franchiseRenewal.approvalStatus === FranchiseApprovalStatus.Paid ||
      franchiseRenewal.approvalStatus === FranchiseApprovalStatus.Approved
    ) {
      throw new BadRequestException('Vehicle already registered');
    }
  }

  getOneById(id: number, memberId?: number): Promise<FranchiseRenewal> {
    const where = memberId ? { id, user: { id: memberId } } : { id };
    return this.franchiseRenewalRepo.findOne({
      where,
      relations: {
        driverProfile: true,
        todaAssociation: true,
      },
    });
  }

  getOneByIdAsTreasurer(id: number): Promise<FranchiseRenewal> {
    return this.franchiseRenewalRepo.findOne({
      where: {
        id,
        approvalStatus: In([
          FranchiseApprovalStatus.Validated,
          FranchiseApprovalStatus.Paid,
        ]),
      },
      relations: {
        driverProfile: true,
        todaAssociation: true,
      },
    });
  }

  async validateUpsert(
    franchiseRenewalDto: FranchiseRenewalCreateDto | FranchiseRenewalUpdateDto,
    memberId: number,
    id?: number,
  ): Promise<boolean> {
    if (!id) {
      await this.validateCreateFranchiseRenewal(
        franchiseRenewalDto as FranchiseRenewalCreateDto,
        memberId,
      );
    } else {
      await this.validateUpdateFranchiseRenewal(id, memberId);
    }

    return true;
  }

  async create(
    franchiseRenewalDto: FranchiseRenewalCreateDto,
    memberId: number,
  ): Promise<FranchiseRenewal> {
    const {
      todaAssociationId,
      driverProfile: newDriverProfile,
      driverProfileId,
      isDriverOwner,
      franchiseId,
      ...moreFranchiseRenewalDto
    } = franchiseRenewalDto;

    await this.validateCreateFranchiseRenewal(franchiseRenewalDto, memberId);

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

    const franchiseRenewal = this.franchiseRenewalRepo.create({
      ...moreFranchiseRenewalDto,
      todaAssociation: { id: todaAssociationId },
      isDriverOwner,
      driverProfile,
      franchise: { id: franchiseId },
    });

    return this.franchiseRepo.save(franchiseRenewal);
  }

  async update(
    franchiseRenewalDto: FranchiseRenewalUpdateDto,
    id: number,
    memberId: number,
  ): Promise<FranchiseRenewal> {
    const { todaAssociationId, franchiseId, ...moreFranchiseRenewalDto } =
      franchiseRenewalDto;

    await this.validateUpdateFranchiseRenewal(id, memberId);

    const franchiseRenewal = await this.franchiseRenewalRepo.findOne({
      where: { id, franchise: { user: { id: memberId } } },
    });

    return this.franchiseRenewalRepo.save({
      ...franchiseRenewal,
      ...moreFranchiseRenewalDto,
      todaAssociation: { id: todaAssociationId },
      franchise: { id: franchiseId },
    });
  }

  async setApprovalStatus(
    id: number,
    approvalStatus?: FranchiseApprovalStatus,
  ): Promise<FranchiseRenewal> {
    const currentDate = dayjs();

    const franchiseRenewal = await this.franchiseRenewalRepo.findOne({
      where: { id },
      relations: { franchise: true },
    });
    // Return error if user row does not exist
    if (!franchiseRenewal)
      throw new NotFoundException('Franchise renewal not found');

    const latestFranchiseRenewals = await this.franchiseRenewalRepo.find({
      where: { franchise: { id: franchiseRenewal.franchise.id } },
      order: { createdAt: 'DESC' },
      take: 2,
      skip: 0,
    });

    if (latestFranchiseRenewals[0].id !== franchiseRenewal.id)
      throw new NotFoundException('Franchise renewal invalid');

    const previousTarget =
      latestFranchiseRenewals.length > 1
        ? latestFranchiseRenewals[1]
        : franchiseRenewal.franchise;

    if (
      !currentDate.isBetween(
        dayjs(previousTarget.expiryDate).subtract(
          ENABLE_RENEW_BEFORE_EXPIRY_DAYS,
          'd',
        ),
        dayjs(previousTarget.expiryDate).add(
          ENABLE_RENEW_AFTER_EXPIRY_DAYS,
          'd',
        ),
        'day',
        '[]',
      )
    ) {
      throw new BadRequestException('Cannot set franchise status');
    }

    let updatedApprovalStatus = approvalStatus;

    if (!approvalStatus) {
      switch (franchiseRenewal.approvalStatus) {
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

    await this.franchiseRenewalRepo.save({
      ...franchiseRenewal,
      approvalStatus: updatedApprovalStatus,
    });

    return this.franchiseRenewalRepo.findOne({
      where: { id },
      relations: {
        driverProfile: true,
        todaAssociation: true,
      },
    });
  }

  async delete(id: number, memberId: number): Promise<boolean> {
    const franchiseRenewal = await this.getOneById(id, memberId);

    if (!franchiseRenewal) {
      throw new NotFoundException('Franchise renewal not found');
    } else if (
      franchiseRenewal.approvalStatus === FranchiseApprovalStatus.Approved
    ) {
      throw new BadRequestException('Cannot delete registered franchise');
    }

    const result = await this.franchiseRenewalRepo.delete({ id });
    return !!result.affected;
  }
}
