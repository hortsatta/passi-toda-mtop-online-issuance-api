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
  Repository,
} from 'typeorm';

import { FranchiseApprovalStatus } from '../franchise/enums/franchise.enum';
import { FranchiseService } from '../franchise/franchise.service';
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

  getLatestRate(feeType: FeeType): Promise<RateSheet> {
    return this.rateSheetRepo.findOne({
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