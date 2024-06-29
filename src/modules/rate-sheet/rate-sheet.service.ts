import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  In,
  LessThanOrEqual,
  Repository,
} from 'typeorm';

import { FranchiseApprovalStatus } from '../franchise/enums/franchise.enum';
import { FranchiseService } from '../franchise/services/franchise.service';
import { FeeType } from './enums/rate-sheet.enum';
import { RateSheet } from './entities/rate-sheet.entity';
import { RateSheetCreateDto } from './dtos/rate-sheet-create.dto';
import { RateSheetUpdateDto } from './dtos/rate-sheet-update.dto';

@Injectable()
export class RateSheetService {
  constructor(
    @InjectRepository(RateSheet)
    private readonly rateSheetRepo: Repository<RateSheet>,
    @Inject(FranchiseService)
    private readonly franchiseService: FranchiseService,
  ) {}

  async valiteRateSheet(id: number) {
    const rateSheet = await this.rateSheetRepo.findOne({ where: { id } });

    if (!rateSheet) throw new NotFoundException('Rate not found');

    const approvedFranchises = await this.franchiseService.getAllFranchises(
      undefined,
      undefined,
      undefined,
      FranchiseApprovalStatus.Approved,
      undefined,
      rateSheet.createdAt,
    );

    if (approvedFranchises.length) {
      throw new BadRequestException('Cannot update item');
    }
  }

  getAllRateSheets(
    sort?: string,
    rateSheetIds?: number[],
    q?: string,
  ): Promise<RateSheet[]> {
    const generateWhere = () => {
      let baseWhere: FindOptionsWhere<RateSheet> = {};

      if (rateSheetIds?.length) {
        baseWhere = { ...baseWhere, id: In(rateSheetIds) };
      }

      if (q?.trim()) {
        baseWhere = { ...baseWhere, name: ILike(`%${q}%`) };
      }

      return baseWhere;
    };

    const generateOrder = (): FindOptionsOrder<RateSheet> => {
      if (!sort) {
        return { name: 'ASC' };
      }

      const [sortBy, sortOrder] = sort?.split(',') || [];
      return { [sortBy]: sortOrder };
    };

    return this.rateSheetRepo.find({
      where: generateWhere(),
      order: generateOrder(),
      relations: { rateSheetFees: true },
    });
  }

  getOneById(id: number): Promise<RateSheet> {
    return this.rateSheetRepo.findOne({
      where: { id },
      relations: { rateSheetFees: true },
    });
  }

  async getLatestRates(feeTypes: FeeType[]): Promise<RateSheet[]> {
    const rateSheets = await Promise.all(
      feeTypes.map((feeType) =>
        this.rateSheetRepo.findOne({
          where: { feeType },
          order: { createdAt: 'DESC' },
          relations: { rateSheetFees: true },
        }),
      ),
    );

    return rateSheets.filter((rateSheet) => !!rateSheet);
  }

  async getFranchiseRatesByFranchiseId(
    franchiseId: number,
  ): Promise<RateSheet[]> {
    const franchise = await this.franchiseService.getOneById(franchiseId);

    if (!franchise) throw new NotFoundException('Franchise not found');

    const generateRegistrationWhere = () => {
      let baseWhere: FindOptionsWhere<RateSheet> = {
        feeType: FeeType.FranchiseRegistration,
      };

      if (
        franchise.approvalStatus === FranchiseApprovalStatus.Paid ||
        franchise.approvalStatus === FranchiseApprovalStatus.Approved
      ) {
        baseWhere = {
          updatedAt: LessThanOrEqual(franchise.approvalDate),
          ...baseWhere,
        };
      }

      return baseWhere;
    };

    const generateRenewalWhere = () => {
      let baseWhere: FindOptionsWhere<RateSheet> = {
        feeType: FeeType.FranchiseRenewal,
      };

      if (
        franchise.franchiseRenewals.length &&
        (franchise.franchiseRenewals[0].approvalStatus ===
          FranchiseApprovalStatus.Paid ||
          franchise.franchiseRenewals[0].approvalStatus ===
            FranchiseApprovalStatus.Approved)
      ) {
        baseWhere = {
          updatedAt: LessThanOrEqual(franchise.approvalDate),
          ...baseWhere,
        };
      }

      return baseWhere;
    };

    const registrationRateSheet = await this.rateSheetRepo.findOne({
      where: generateRegistrationWhere(),
      order: { createdAt: 'DESC' },
      relations: { rateSheetFees: true },
    });

    const renewalRateSheet = await this.rateSheetRepo.findOne({
      where: generateRenewalWhere(),
      order: { createdAt: 'DESC' },
      relations: { rateSheetFees: true },
    });

    return [registrationRateSheet, renewalRateSheet];
  }

  getLatestRate(feeType: FeeType): Promise<RateSheet> {
    return this.rateSheetRepo.findOne({
      where: { feeType },
      order: { createdAt: 'DESC' },
      relations: { rateSheetFees: true },
    });
  }

  getRateHistory(feeType: FeeType): Promise<RateSheet[]> {
    return this.rateSheetRepo.find({
      where: { feeType },
      order: { createdAt: 'DESC' },
      relations: { rateSheetFees: true },
    });
  }

  async create(rateSheetDto: RateSheetCreateDto): Promise<RateSheet> {
    const rateSheet = this.rateSheetRepo.create(rateSheetDto);
    return this.rateSheetRepo.save(rateSheet);
  }

  async update(
    rateSheetDto: RateSheetUpdateDto,
    id: number,
  ): Promise<RateSheet> {
    await this.valiteRateSheet(id);
    return this.rateSheetRepo.save(rateSheetDto);
  }

  async delete(id: number): Promise<boolean> {
    await this.valiteRateSheet(id);
    const result = await this.rateSheetRepo.delete({ id });
    return !!result.affected;
  }
}
