import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';

import { UseSerializeInterceptor } from '#/common/interceptors/serialize.interceptor';
import { UseFilterFieldsInterceptor } from '#/common/interceptors/filter-fields.interceptor';
import { CurrentUser } from '../../user/decorators/current-user.decorator';
import { UseAuthGuard } from '../../user/guards/auth.guard';
import { UserRole } from '../../user/enums/user.enum';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { User } from '../../user/entities/user.entity';
import { Franchise } from '../entities/franchise.entity';
import { FranchiseService } from '../services/franchise.service';
import { FranchiseResponseDto } from '../dtos/franchise-response.dto';
import { FranchiseCreateDto } from '../dtos/franchise-create.dto';
import { FranchiseUpdateDto } from '../dtos/franchise-update.dto';
import {
  FranchiseDigest,
  FranchiseDigestResponseDto,
} from '../dtos/franchise-digest-response.dto';

const ISSUER_URL = '/issuer';
const TREASURER_URL = '/treasurer';

@Controller('franchises')
export class FranchiseController {
  constructor(private readonly franchiseService: FranchiseService) {}

  @Get('/list/all')
  @UseAuthGuard()
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(FranchiseResponseDto)
  getAllByMemberId(
    @CurrentUser() user: User,
    @Query('memberId') memberId?: string,
    @Query('ids') ids?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('take') take?: string,
  ): Promise<Franchise[]> {
    const id = user.role === UserRole.Member ? user.id : +(memberId || 0);
    const transformedIds = ids?.split(',').map((id) => +id);
    return this.franchiseService.getAllFranchisesByMemberId(
      id,
      sort,
      transformedIds,
      q,
      status,
      !!take ? +take : undefined,
    );
  }

  @Get(`${ISSUER_URL}/list/all`)
  @UseAuthGuard([UserRole.Admin, UserRole.Issuer, UserRole.Treasurer])
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(FranchiseResponseDto)
  async getAll(
    @CurrentUser() user: User,
    @Query('ids') ids?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('take') take?: string,
  ): Promise<Franchise[]> {
    const transformedIds = ids?.split(',').map((id) => +id);

    const franchises = await this.franchiseService.getAllFranchises(
      sort,
      transformedIds,
      q,
      status,
      !!take ? +take : undefined,
    );

    if (user.role === UserRole.Treasurer) {
      return franchises.filter(
        (franchise) =>
          franchise.approvalStatus === FranchiseApprovalStatus.Approved ||
          franchise.approvalStatus === FranchiseApprovalStatus.Paid,
      );
    }

    return franchises;
  }

  @Get(`${ISSUER_URL}/list/digest`)
  @UseAuthGuard([UserRole.Admin, UserRole.Issuer, UserRole.Treasurer])
  @UseSerializeInterceptor(FranchiseDigestResponseDto)
  async getIssuerDigestList(
    @CurrentUser() user: User,
  ): Promise<FranchiseDigest> {
    const sort = 'approvalDate:DESC';
    const take = 10;

    const pendingValidations = await this.franchiseService.getAllFranchises(
      'createdAt:DESC',
      undefined,
      undefined,
      FranchiseApprovalStatus.PendingValidation,
    );

    const validatedList = await this.franchiseService.getAllFranchises(
      sort,
      undefined,
      undefined,
      FranchiseApprovalStatus.Validated,
    );

    const paidList = await this.franchiseService.getAllFranchises(
      sort,
      undefined,
      undefined,
      FranchiseApprovalStatus.Paid,
    );

    const recentApprovals = await this.franchiseService.getAllFranchises(
      sort,
      undefined,
      undefined,
      FranchiseApprovalStatus.Approved,
      take,
    );

    const recentRejections = await this.franchiseService.getAllFranchises(
      sort,
      undefined,
      undefined,
      FranchiseApprovalStatus.Rejected,
      take,
    );

    if (user.role === UserRole.Treasurer) {
      return {
        validatedList,
        paidList,
        pendingValidations: [],
        recentApprovals: [],
        recentRejections: [],
      };
    }

    return {
      pendingValidations,
      validatedList,
      paidList,
      recentApprovals,
      recentRejections,
    };
  }

  @Get('/:id')
  @UseAuthGuard([UserRole.Member, UserRole.Issuer, UserRole.Admin])
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(FranchiseResponseDto)
  getOneById(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Franchise> {
    const memberId = user.role === UserRole.Member ? user.id : undefined;
    return this.franchiseService.getOneById(+id, memberId);
  }

  @Get(`${TREASURER_URL}/:id`)
  @UseAuthGuard(UserRole.Treasurer)
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(FranchiseResponseDto)
  getOneByIdAsTreasurer(@Param('id') id: string): Promise<Franchise> {
    return this.franchiseService.getOneByIdAsTreasurer(+id);
  }

  @Get('/check/:mvPlateNo')
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(FranchiseResponseDto)
  checkOneByMvPlateNo(
    @Param('mvPlateNo') mvPlateNo: string,
  ): Promise<Franchise | null> {
    return this.franchiseService.checkOneByMvPlateNo(mvPlateNo);
  }

  @Post('/validate')
  @UseAuthGuard(UserRole.Member)
  async validateUpsert(
    @Body() body: FranchiseCreateDto | FranchiseUpdateDto,
    @CurrentUser() user: User,
    @Query('id') id?: string,
  ) {
    return this.franchiseService.validateUpsert(
      body,
      user.id,
      id ? +id : undefined,
    );
  }

  @Post()
  @UseAuthGuard(UserRole.Member)
  @UseSerializeInterceptor(FranchiseResponseDto)
  create(
    @Body() body: FranchiseCreateDto,
    @CurrentUser() user: User,
  ): Promise<Franchise> {
    return this.franchiseService.create(body, user.id);
  }

  @Patch('/:id')
  @UseAuthGuard(UserRole.Member)
  @UseSerializeInterceptor(FranchiseResponseDto)
  update(
    @Param('id') id: string,
    @Body() body: FranchiseUpdateDto,
    @CurrentUser() user: User,
  ): Promise<Franchise> {
    return this.franchiseService.update(body, +id, user.id);
  }

  @Patch('/approve/:id')
  @UseAuthGuard()
  approveFranchise(
    @Param('id') id: string,
    @Body() body: { approvalStatus?: FranchiseApprovalStatus },
    @CurrentUser() user: User,
  ): Promise<Franchise> {
    if (
      (user.role === UserRole.Member &&
        body.approvalStatus !== FranchiseApprovalStatus.Canceled) ||
      (user.role === UserRole.Treasurer &&
        body.approvalStatus !== FranchiseApprovalStatus.Paid) ||
      (user.role === UserRole.Issuer &&
        body.approvalStatus === FranchiseApprovalStatus.Paid)
    ) {
      throw new UnauthorizedException('Action is forbidden');
    }

    return this.franchiseService.setApprovalStatus(+id, body.approvalStatus);
  }

  @Delete('/:id')
  @UseAuthGuard(UserRole.Member)
  delete(@Param('id') id: string, @CurrentUser() user: User): Promise<boolean> {
    return this.franchiseService.delete(+id, user.id);
  }
}
