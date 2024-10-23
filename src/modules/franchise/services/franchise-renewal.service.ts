import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';

import dayjs from '#/common/config/dayjs.config';
import { DriverProfileService } from '#/modules/user/services/driver-profile.service';
import {
  ENABLE_RENEW_AFTER_EXPIRY_DAYS,
  ENABLE_RENEW_BEFORE_EXPIRY_DAYS,
} from '../config/franchise.config';
import { transformFranchises } from '../helpers/franchise.helper';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { Franchise } from '../entities/franchise.entity';
import { FranchiseRenewal } from '../entities/franchise-renewal.entity';
import { TodaAssociation } from '../entities/toda-association.entity';
import { FranchiseRenewalCreateDto } from '../dtos/franchise-renewal-create.dto';
import { FranchiseRenewalUpdateDto } from '../dtos/franchise-renewal-update.dto';
import { FranchiseApprovalStatusUpdateDto } from '../dtos/franchise-approval-status-update.dto';
import { FranchiseResponse } from '../dtos/franchise-response.dto';

@Injectable()
export class FranchiseRenewalService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
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
    const {
      todaAssociationId,
      driverProfileId,
      driverProfile,
      isDriverOwner,
      franchiseId,
    } = franchiseRenewalDto;

    const franchise = await this.franchiseRepo.findOne({
      where: { id: franchiseId },
      relations: {
        driverProfile: true,
        todaAssociation: true,
        franchiseRenewals: { todaAssociation: true, driverProfile: true },
      },
    });

    const todaAssociation = await this.todaAssociationRepo.findOne({
      where: { id: todaAssociationId },
    });

    if (!todaAssociation) {
      throw new BadRequestException('TODA Association not found');
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

    if (!franchise) {
      throw new BadRequestException('Franchise does not exist');
    } else if (franchise.approvalStatus !== FranchiseApprovalStatus.Approved) {
      throw new BadRequestException('Franchise not yet approved');
    }

    const transformedFranchise = transformFranchises(
      franchise,
    ) as FranchiseResponse;

    if (!transformedFranchise.canRenew) {
      throw new BadRequestException('Cannot renew franchise');
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
      franchiseRenewal.approvalStatus === FranchiseApprovalStatus.Approved ||
      franchiseRenewal.approvalStatus === FranchiseApprovalStatus.Revoked
    ) {
      throw new BadRequestException('Vehicle already registered');
    }
  }

  async sendEmailFranchiseRenewal(franchise: Franchise) {
    const {
      id,
      plateNo,
      user: { userProfile, email },
    } = franchise;

    const url = `${this.configService.get<string>('APP_BASE_URL')}/m/franchises/${id}`;

    await this.mailerService.sendMail({
      to: email,
      subject: `${plateNo.toUpperCase()} Franchise Renewal`,
      template: './franchise-issuance',
      context: {
        name: userProfile.firstName || email,
        plateNo,
        url,
        issuanceText: 'renewal',
      },
    });
  }

  async sendEmailApprovalStatusChange(
    franchiseRenewal: FranchiseRenewal,
    franchise: Franchise,
  ) {
    const approvalStatus = franchiseRenewal.approvalStatus;

    const {
      id,
      plateNo,
      user: { userProfile, email },
    } = franchise;

    const approvalStatusText = {
      [FranchiseApprovalStatus.Approved]: 'Approved',
      [FranchiseApprovalStatus.Canceled]: 'Canceled',
      [FranchiseApprovalStatus.Paid]: 'Paid',
      [FranchiseApprovalStatus.PendingValidation]: 'Pending Validation',
      [FranchiseApprovalStatus.Rejected]: 'Rejected',
      [FranchiseApprovalStatus.Revoked]: 'Revoked',
      [FranchiseApprovalStatus.Validated]: 'Validated',
    };

    const url = `${this.configService.get<string>('APP_BASE_URL')}/m/franchises/${id}`;

    await this.mailerService.sendMail({
      to: email,
      subject: `${plateNo.toUpperCase()} Franchise has been Updated`,
      template: './franchise-approval-status-change',
      context: {
        name: userProfile.firstName || email,
        plateNo,
        approvalStatus: approvalStatusText[approvalStatus],
        url,
      },
    });
  }

  getOneById(id: number, memberId?: number): Promise<FranchiseRenewal> {
    const where = memberId ? { id, user: { id: memberId } } : { id };
    return this.franchiseRenewalRepo.findOne({
      where,
      relations: {
        driverProfile: true,
        todaAssociation: true,
        franchiseStatusRemarks: true,
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
        franchiseStatusRemarks: true,
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

    const newFranchiseRenewal =
      await this.franchiseRenewalRepo.save(franchiseRenewal);

    const targetFranchiseRenewal = await this.franchiseRenewalRepo.findOne({
      where: { id: newFranchiseRenewal.id },
      relations: { franchise: { user: true } },
    });

    await this.sendEmailFranchiseRenewal(targetFranchiseRenewal.franchise);

    return newFranchiseRenewal;
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
    franchiseApprovalStatusDto: FranchiseApprovalStatusUpdateDto,
  ): Promise<FranchiseRenewal> {
    const { approvalStatus, statusRemarks } = franchiseApprovalStatusDto;

    const franchiseRenewal = await this.franchiseRenewalRepo.findOne({
      where: { id },
      relations: { franchise: { user: true } },
    });
    // Return error if user row does not exist
    if (!franchiseRenewal)
      throw new NotFoundException('Franchise renewal not found');

    if (
      franchiseRenewal.approvalStatus !== FranchiseApprovalStatus.Approved &&
      approvalStatus === FranchiseApprovalStatus.Revoked
    )
      throw new BadRequestException('Cannot set franchise status');

    const latestFranchiseRenewals = await this.franchiseRenewalRepo.find({
      where: {
        franchise: { id: franchiseRenewal.franchise.id },
        approvalStatus: FranchiseApprovalStatus.Approved,
      },
      order: { createdAt: 'DESC' },
      take: 2,
      skip: 0,
    });

    if (
      latestFranchiseRenewals.length &&
      latestFranchiseRenewals[0]?.id !== franchiseRenewal?.id
    )
      throw new NotFoundException('Franchise renewal invalid');

    const previousTarget =
      latestFranchiseRenewals.length > 1
        ? latestFranchiseRenewals[1]
        : franchiseRenewal.franchise;

    if (
      !dayjs().isBetween(
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
      franchiseStatusRemarks: statusRemarks?.length ? statusRemarks : undefined,
    });

    const targetFranchiseRenewal = await this.franchiseRenewalRepo.findOne({
      where: { id },
      relations: {
        driverProfile: true,
        todaAssociation: true,
        franchiseStatusRemarks: true,
        franchise: { user: true },
      },
    });

    await this.sendEmailApprovalStatusChange(
      targetFranchiseRenewal,
      franchiseRenewal.franchise,
    );

    return targetFranchiseRenewal;
  }

  async setTreasurerApprovalStatus(
    id: number,
    paymentORNo: string,
  ): Promise<FranchiseRenewal> {
    if (!paymentORNo.length) {
      throw new BadRequestException('Invalid OR Number');
    }

    const franchiseRenewal = await this.franchiseRenewalRepo.findOne({
      where: { id },
      relations: { franchise: true },
    });
    // Return error if user row does not exist
    if (!franchiseRenewal)
      throw new NotFoundException('Franchise renewal not found');

    if (franchiseRenewal.approvalStatus !== FranchiseApprovalStatus.Validated)
      throw new BadRequestException('Cannot set franchise status');

    const latestFranchiseRenewals = await this.franchiseRenewalRepo.find({
      where: {
        franchise: { id: franchiseRenewal.franchise.id },
        approvalStatus: FranchiseApprovalStatus.Approved,
      },
      order: { createdAt: 'DESC' },
      take: 2,
      skip: 0,
    });

    if (
      latestFranchiseRenewals.length &&
      latestFranchiseRenewals[0].id !== franchiseRenewal.id
    )
      throw new NotFoundException('Franchise renewal invalid');

    const previousTarget =
      latestFranchiseRenewals.length > 1
        ? latestFranchiseRenewals[1]
        : franchiseRenewal.franchise;

    if (
      !dayjs().isBetween(
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

    // TODO check franchise if vehicleORNo is correct then save

    await this.franchiseRenewalRepo.save({
      ...franchiseRenewal,
      approvalStatus: FranchiseApprovalStatus.Paid,
      paymentORNo,
    });

    const targetFranchiseRenewal = await this.franchiseRenewalRepo.findOne({
      where: { id },
      relations: {
        driverProfile: true,
        todaAssociation: true,
        franchiseStatusRemarks: true,
      },
    });

    await this.sendEmailApprovalStatusChange(
      targetFranchiseRenewal,
      franchiseRenewal.franchise,
    );

    return targetFranchiseRenewal;
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
