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
import { UseAuthGuard } from '../user/guards/auth.guard';
import { RateSheetService } from './rate-sheet.service';
import { RateSheet } from './entities/rate-sheet.entity';
import { RateSheetResponseDto } from './dtos/rate-sheet-response.dto';
import { UserRole } from '../user/enums/user.enum';
import { RateSheetCreateDto } from './dtos/rate-sheet-create.dto';
import { RateSheetUpdateDto } from './dtos/rate-sheet-update.dto';

@Controller('rate-sheets')
export class RateSheetController {
  constructor(private readonly rateSheetService: RateSheetService) {}

  @Get('/list/all')
  @UseAuthGuard()
  @UseFilterFieldsInterceptor(true)
  @UseSerializeInterceptor(RateSheetResponseDto)
  getAll(
    @Query('ids') ids?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
  ): Promise<RateSheet[]> {
    const transformedIds = ids?.split(',').map((id) => +id);
    return this.rateSheetService.getAllRateSheets(sort, transformedIds, q);
  }

  @Get('/:id')
  @UseAuthGuard()
  @UseSerializeInterceptor(RateSheetResponseDto)
  getOneById(@Param('id') id: string): Promise<RateSheet> {
    return this.rateSheetService.getOneById(+id);
  }

  @Post()
  @UseAuthGuard(UserRole.Admin)
  @UseSerializeInterceptor(RateSheetResponseDto)
  create(@Body() body: RateSheetCreateDto): Promise<RateSheet> {
    return this.rateSheetService.create(body);
  }

  @Patch('/:id')
  @UseAuthGuard(UserRole.Admin)
  @UseSerializeInterceptor(RateSheetResponseDto)
  update(
    @Param('id') id: string,
    @Body() body: RateSheetUpdateDto,
  ): Promise<RateSheet> {
    return this.rateSheetService.update(body, +id);
  }

  @Delete('/:id')
  @UseAuthGuard(UserRole.Member)
  delete(@Param('id') id: string) {
    return this.rateSheetService.delete(+id);
  }
}
