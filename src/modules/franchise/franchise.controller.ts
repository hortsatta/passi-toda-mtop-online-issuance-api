import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { UseSerializeInterceptor } from '#/common/interceptors/serialize.interceptor';
import { UseFilterFieldsInterceptor } from '#/common/interceptors/filter-fields.interceptor';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { UseAuthGuard } from '../user/guards/auth.guard';
import { UserRole } from '../user/enums/user.enum';
import { User } from '../user/entities/user.entity';
import { Franchise } from './entities/franchise.entity';
import { FranchiseService } from './franchise.service';
import { FranchiseResponseDto } from './dtos/franchise-response.dto';
import { FranchiseCreateDto } from './dtos/franchise-create.dto';
import { FranchiseUpdateDto } from './dtos/franchise-update.dto';
import { FranchiseApprovalStatus } from './enums/franchise.enum';

@Controller('franchises')
export class FranchiseController {
  constructor(private readonly franchiseService: FranchiseService) {}

  @Get('/list/all')
  @UseAuthGuard([UserRole.Admin, UserRole.Issuer, UserRole.Member])
  @UseFilterFieldsInterceptor(true)
  @UseSerializeInterceptor(FranchiseResponseDto)
  getAll(
    @CurrentUser() user: User,
    @Query('memberId') memberId?: string,
    @Query('ids') ids?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ): Promise<Franchise[]> {
    const id = user.role === UserRole.Member ? user.id : +(memberId || 0);
    const transformedIds = ids?.split(',').map((id) => +id);
    return this.franchiseService.getAllFranchisesByMemberId(
      id,
      sort,
      transformedIds,
      q,
      status,
    );
  }

  @Get('/:id')
  @UseAuthGuard([UserRole.Admin, UserRole.Issuer, UserRole.Member])
  @UseSerializeInterceptor(FranchiseResponseDto)
  getOneById(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Franchise> {
    const memberId = user.role === UserRole.Member ? user.id : undefined;
    return this.franchiseService.getOneById(+id, memberId);
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
  @UseAuthGuard([UserRole.Admin, UserRole.Issuer])
  approveUser(
    @Param('id') id: string,
    @Body() body: { approvalStatus?: FranchiseApprovalStatus },
  ): Promise<Franchise> {
    return this.franchiseService.setApprovalStatus(+id, body.approvalStatus);
  }

  @Delete('/:id')
  @UseAuthGuard(UserRole.Member)
  delete(@Param('id') id: string, @CurrentUser() user: User): Promise<boolean> {
    return this.franchiseService.delete(+id, user.id);
  }
}
