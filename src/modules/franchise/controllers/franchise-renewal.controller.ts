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

import { UseFilterFieldsInterceptor } from '#/common/interceptors/filter-fields.interceptor';
import { UseSerializeInterceptor } from '#/common/interceptors/serialize.interceptor';
import { CurrentUser } from '#/modules/user/decorators/current-user.decorator';
import { User } from '#/modules/user/entities/user.entity';
import { UserRole } from '#/modules/user/enums/user.enum';
import { UseAuthGuard } from '#/modules/user/guards/auth.guard';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { FranchiseRenewal } from '../entities/franchise-renewal.entity';
import { FranchiseRenewalCreateDto } from '../dtos/franchise-renewal-create.dto';
import { FranchiseRenewalResponseDto } from '../dtos/franchise-renewal-response.dto';
import { FranchiseRenewalUpdateDto } from '../dtos/franchise-renewal-update.dto';
import { FranchiseApprovalStatusUpdateDto } from '../dtos/franchise-approval-status-update.dto';
import { FranchiseRenewalService } from '../services/franchise-renewal.service';

const TREASURER_URL = '/treasurer';

@Controller('franchise-renewals')
export class FranchiseRenewalController {
  constructor(
    private readonly franchiseRenewalService: FranchiseRenewalService,
  ) {}

  @Get('/:id')
  @UseAuthGuard([UserRole.Member, UserRole.Issuer, UserRole.Admin])
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(FranchiseRenewalResponseDto)
  getOneById(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<FranchiseRenewal> {
    const memberId = user.role === UserRole.Member ? user.id : undefined;
    return this.franchiseRenewalService.getOneById(+id, memberId);
  }

  @Get(`${TREASURER_URL}/:id`)
  @UseAuthGuard(UserRole.Treasurer)
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(FranchiseRenewalResponseDto)
  getOneByIdAsTreasurer(@Param('id') id: string): Promise<FranchiseRenewal> {
    return this.franchiseRenewalService.getOneByIdAsTreasurer(+id);
  }

  @Post('/validate')
  @UseAuthGuard(UserRole.Member)
  async validateUpsert(
    @Body() body: FranchiseRenewalCreateDto | FranchiseRenewalUpdateDto,
    @CurrentUser() user: User,
    @Query('id') id?: string,
  ) {
    return this.franchiseRenewalService.validateUpsert(
      body,
      user.id,
      id ? +id : undefined,
    );
  }

  @Post()
  @UseAuthGuard(UserRole.Member)
  @UseSerializeInterceptor(FranchiseRenewalResponseDto)
  create(
    @Body() body: FranchiseRenewalCreateDto,
    @CurrentUser() user: User,
  ): Promise<FranchiseRenewal> {
    return this.franchiseRenewalService.create(body, user.id);
  }

  @Patch('/:id')
  @UseAuthGuard(UserRole.Member)
  @UseSerializeInterceptor(FranchiseRenewalResponseDto)
  update(
    @Param('id') id: string,
    @Body() body: FranchiseRenewalUpdateDto,
    @CurrentUser() user: User,
  ): Promise<FranchiseRenewal> {
    return this.franchiseRenewalService.update(body, +id, user.id);
  }

  @Patch('/approve/:id')
  @UseAuthGuard()
  approveFranchiseRenewal(
    @Param('id') id: string,
    @Body() body: FranchiseApprovalStatusUpdateDto,
    @CurrentUser() user: User,
  ): Promise<FranchiseRenewal> {
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

    return this.franchiseRenewalService.setApprovalStatus(+id, body);
  }

  @Patch(`${TREASURER_URL}/approve/:id`)
  @UseAuthGuard(UserRole.Treasurer)
  @UseSerializeInterceptor(FranchiseRenewalResponseDto)
  approveTreasurerFranchise(
    @Param('id') id: string,
    @Body() body: { paymentORNo: string },
  ): Promise<FranchiseRenewal> {
    return this.franchiseRenewalService.setTreasurerApprovalStatus(
      +id,
      body.paymentORNo,
    );
  }

  @Delete('/:id')
  @UseAuthGuard(UserRole.Member)
  delete(@Param('id') id: string, @CurrentUser() user: User): Promise<boolean> {
    return this.franchiseRenewalService.delete(+id, user.id);
  }
}
