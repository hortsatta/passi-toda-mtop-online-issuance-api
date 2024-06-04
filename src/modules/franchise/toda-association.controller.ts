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

import { UseFilterFieldsInterceptor } from '#/common/interceptors/filter-fields.interceptor';
import { UseSerializeInterceptor } from '#/common/interceptors/serialize.interceptor';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { UserRole } from '../user/enums/user.enum';
import { UseAuthGuard } from '../user/guards/auth.guard';
import { User } from '../user/entities/user.entity';
import { TodaAssociationService } from './toda-association.service';
import { TodaAssociation } from './entities/toda-association.entity';
import { TodaAssociationResponseDto } from './dtos/toda-association-response.dto';
import { TodaAssociationCreateDto } from './dtos/toda-association-create.dto';
import { TodaAssociationUpdateDto } from './dtos/toda-association-update.dto';

@Controller('toda-associations')
export class TodaAssociationController {
  constructor(
    private readonly todaAssociationService: TodaAssociationService,
  ) {}

  @Get('/list/all')
  @UseFilterFieldsInterceptor(true)
  @UseSerializeInterceptor(TodaAssociationResponseDto)
  getAll(
    @CurrentUser() user: User,
    @Query('ids') ids?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
    @Query('withFranchise') withFranchise?: boolean,
  ): Promise<TodaAssociation[]> {
    const transformedIds = ids?.split(',').map((id) => +id);
    const includeFranchise =
      user?.role === UserRole.Member ? false : withFranchise;

    return this.todaAssociationService.getAllTodaAssociations(
      sort,
      transformedIds,
      q,
      includeFranchise,
    );
  }

  @Get('/:id')
  @UseAuthGuard([UserRole.Admin, UserRole.Issuer, UserRole.Member])
  @UseSerializeInterceptor(TodaAssociationResponseDto)
  getOneById(@Param('id') id: string) {
    return this.todaAssociationService.getOneById(+id);
  }

  @Post()
  @UseAuthGuard(UserRole.Admin)
  @UseSerializeInterceptor(TodaAssociationResponseDto)
  create(@Body() body: TodaAssociationCreateDto): Promise<TodaAssociation> {
    return this.todaAssociationService.create(body);
  }

  @Patch('/:id')
  @UseAuthGuard(UserRole.Member)
  @UseSerializeInterceptor(TodaAssociationResponseDto)
  update(
    @Param('id') id: string,
    @Body() body: TodaAssociationUpdateDto,
  ): Promise<TodaAssociation> {
    return this.todaAssociationService.update(body, +id);
  }

  @Delete('/:id')
  @UseAuthGuard(UserRole.Member)
  delete(@Param('id') id: string): Promise<boolean> {
    return this.todaAssociationService.delete(+id);
  }
}
