import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
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
import { transformFranchises } from '../helpers/franchise.helper';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { Franchise } from '../entities/franchise.entity';
import { TodaAssociation } from '../entities/toda-association.entity';
import { FranchiseCreateDto } from '../dtos/franchise-create.dto';
import { FranchiseUpdateDto } from '../dtos/franchise-update.dto';
import { FranchiseApprovalStatusUpdateDto } from '../dtos/franchise-approval-status-update.dto';
import { FranchiseResponse } from '../dtos/franchise-response.dto';

@Injectable()
export class FranchiseService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
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
      plateNo,
      todaAssociationId,
      driverProfileId,
      driverProfile,
      isDriverOwner,
    } = franchiseDto;

    const existingFranchise = await this.franchiseRepo.findOne({
      where: { plateNo },
      relations: {
        user: true,
        franchiseRenewals: { driverProfile: true, todaAssociation: true },
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

    if (!existingFranchise) return;

    const franchiseResponse = transformFranchises(
      existingFranchise,
    ) as FranchiseResponse;

    if (franchiseResponse.user.id === memberId) {
      throw new BadRequestException('Vehicle already exist');
    }

    if (
      franchiseResponse.approvalStatus === FranchiseApprovalStatus.Revoked ||
      (franchiseResponse.approvalStatus === FranchiseApprovalStatus.Approved &&
        !franchiseResponse.isExpired) ||
      (franchiseResponse.approvalStatus === FranchiseApprovalStatus.Approved &&
        franchiseResponse.isExpired &&
        franchiseResponse.canRenew) ||
      franchiseResponse.approvalStatus === FranchiseApprovalStatus.Paid ||
      franchiseResponse.approvalStatus === FranchiseApprovalStatus.Validated
    ) {
      throw new BadRequestException('Vehicle already registered');
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
        FranchiseApprovalStatus.Revoked,
      ]),
    };

    const existingFranchise = await this.franchiseRepo.findOne({
      where: { plateNo: franchise.plateNo, ...baseWhere },
    });

    if (existingFranchise) {
      throw new BadRequestException('Vehicle already registered');
    }
  }

  async sendEmailFranchiseRegistration(franchise: Franchise) {
    const {
      id,
      plateNo,
      user: { userProfile, email },
    } = franchise;

    const url = `${this.configService.get<string>('APP_BASE_URL')}/m/franchises/${id}`;

    await this.mailerService.sendMail({
      to: email,
      subject: `${plateNo.toUpperCase()} Franchise Registration`,
      template: './franchise-issuance',
      context: {
        name: userProfile.firstName || email,
        plateNo,
        url,
        issuanceText: 'registration',
      },
    });
  }

  async sendEmailApprovalStatusChange(franchise: Franchise) {
    const {
      id,
      plateNo,
      approvalStatus,
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
        return [{ plateNo: ILike(`%${q}%`), ...baseWhere }];
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
        franchiseStatusRemarks: true,
        franchiseRenewals: {
          driverProfile: true,
          todaAssociation: true,
          franchiseStatusRemarks: true,
        },
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
          { vehicleMake: ILike(`%${q}%`), ...baseWhere },
          { vehicleMotorNo: ILike(`%${q}%`), ...baseWhere },
          { vehicleChassisNo: ILike(`%${q}%`), ...baseWhere },
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
        franchiseStatusRemarks: true,
        franchiseRenewals: {
          todaAssociation: true,
          driverProfile: true,
          franchiseStatusRemarks: true,
        },
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
        franchiseStatusRemarks: true,
        franchiseRenewals: {
          todaAssociation: true,
          driverProfile: true,
          franchiseStatusRemarks: true,
        },
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
        franchiseStatusRemarks: true,
        franchiseRenewals: {
          todaAssociation: true,
          driverProfile: true,
          franchiseStatusRemarks: true,
        },
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
        franchiseStatusRemarks: true,
        franchiseRenewals: {
          todaAssociation: true,
          driverProfile: true,
          franchiseStatusRemarks: true,
        },
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

    const where = [{ plateNo: Equal(mvPlateNo), ...baseWhere }];

    const franchise = await this.franchiseRepo.findOne({
      where,
      relations: {
        user: true,
        driverProfile: true,
        todaAssociation: true,
        franchiseStatusRemarks: true,
        franchiseRenewals: {
          todaAssociation: true,
          driverProfile: true,
          franchiseStatusRemarks: true,
        },
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
      plateNo: targetPlateNo,
      vehicleMake: targetVehicleMake,
      vehicleMotorNo: targetVehicleMotorNo,
      vehicleChassisNo: targetVehicleChassisNo,
      todaAssociationId,
      driverProfile: newDriverProfile,
      driverProfileId,
      isDriverOwner,
      ...moreFranchiseDto
    } = franchiseDto;

    await this.validateCreateFranchise(franchiseDto, memberId);

    const plateNo = targetPlateNo.toLowerCase();
    const vehicleMake = targetVehicleMake.toLowerCase();
    const vehicleMotorNo = targetVehicleMotorNo.toLowerCase();
    const vehicleChassisNo = targetVehicleChassisNo.toLowerCase();

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
      plateNo,
      vehicleMake,
      vehicleMotorNo,
      vehicleChassisNo,
      todaAssociation: { id: todaAssociationId },
      isDriverOwner,
      driverProfile,
      user: { id: memberId },
    });

    const newFranchise = await this.franchiseRepo.save(franchise);

    const targetFranchise = await this.franchiseRepo.findOne({
      where: { id: newFranchise.id },
      relations: { user: true },
    });

    await this.sendEmailFranchiseRegistration(targetFranchise);

    return { ...newFranchise, canRenew: false, isExpired: false };
  }

  async update(
    franchiseDto: FranchiseUpdateDto,
    id: number,
    memberId: number,
  ): Promise<FranchiseResponse> {
    const {
      plateNo: targetPlateNo,
      vehicleMake: targetVehicleMake,
      vehicleMotorNo: targetVehicleMotorNo,
      vehicleChassisNo: targetVehicleChassisNo,
      todaAssociationId,
      ...moreFranchiseDto
    } = franchiseDto;

    await this.validateUpdateFranchise(id, memberId);

    const franchise = await this.franchiseRepo.findOne({
      where: { id, user: { id: memberId } },
    });

    const plateNo = targetPlateNo?.toLowerCase();
    const vehicleMake = targetVehicleMake?.toLowerCase();
    const vehicleMotorNo = targetVehicleMotorNo?.toLowerCase();
    const vehicleChassisNo = targetVehicleChassisNo?.toLowerCase();

    const updatedFranchise = await this.franchiseRepo.save({
      ...franchise,
      ...moreFranchiseDto,
      ...(plateNo && { plateNo }),
      ...(vehicleMake && { vehicleMake }),
      ...(vehicleMotorNo && { vehicleMotorNo }),
      ...(vehicleChassisNo && { vehicleChassisNo }),
      todaAssociation: { id: todaAssociationId },
    });

    return transformFranchises(updatedFranchise) as FranchiseResponse;
  }

  async setApprovalStatus(
    id: number,
    franchiseApprovalStatusDto: FranchiseApprovalStatusUpdateDto,
  ): Promise<FranchiseResponse> {
    const { approvalStatus, statusRemarks } = franchiseApprovalStatusDto;

    const franchise = await this.franchiseRepo.findOne({
      where: { id },
      relations: { franchiseRenewals: true },
    });
    // Return error if user row does not exist
    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    } else if (
      franchise.franchiseRenewals.length ||
      (franchise.approvalStatus !== FranchiseApprovalStatus.Approved &&
        approvalStatus === FranchiseApprovalStatus.Revoked)
    ) {
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
      franchiseStatusRemarks: statusRemarks?.length ? statusRemarks : undefined,
    });

    const updatedFranchise = await this.franchiseRepo.findOne({
      where: { id },
      relations: {
        user: true,
        driverProfile: true,
        todaAssociation: true,
        franchiseStatusRemarks: true,
        franchiseRenewals: {
          todaAssociation: true,
          driverProfile: true,
          franchiseStatusRemarks: true,
        },
      },
    });

    await this.sendEmailApprovalStatusChange(updatedFranchise);

    return transformFranchises(updatedFranchise) as FranchiseResponse;
  }

  async setTreasurerApprovalStatus(id: number, paymentORNo: string) {
    if (!paymentORNo.length) {
      throw new BadRequestException('Invalid OR Number');
    }

    const franchise = await this.franchiseRepo.findOne({
      where: { id },
      relations: { franchiseRenewals: true },
    });
    // Return error if user row does not exist
    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    } else if (
      franchise.franchiseRenewals.length ||
      franchise.approvalStatus !== FranchiseApprovalStatus.Validated
    ) {
      throw new BadRequestException('Cannot set franchise status');
    }

    // TODO check franchise if vehicleORNo is correct then save

    await this.franchiseRepo.save({
      ...franchise,
      approvalStatus: FranchiseApprovalStatus.Paid,
      paymentORNo,
    });

    const updatedFranchise = await this.franchiseRepo.findOne({
      where: { id },
      relations: {
        user: true,
        driverProfile: true,
        todaAssociation: true,
        franchiseStatusRemarks: true,
        franchiseRenewals: {
          todaAssociation: true,
          driverProfile: true,
          franchiseStatusRemarks: true,
        },
      },
    });

    await this.sendEmailApprovalStatusChange(updatedFranchise);

    return transformFranchises(updatedFranchise) as FranchiseResponse;

    // TODO
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
