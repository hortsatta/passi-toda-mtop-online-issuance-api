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
import { UserRole } from '../user/enums/user.enum';
import { RateSheetService } from './rate-sheet.service';
import { RateSheet } from './entities/rate-sheet.entity';
import { RateSheetResponseDto } from './dtos/rate-sheet-response.dto';
import { FeeType } from './enums/rate-sheet.enum';
import { RateSheetCreateDto } from './dtos/rate-sheet-create.dto';
import { RateSheetUpdateDto } from './dtos/rate-sheet-update.dto';

@Controller('rate-sheets')
export class RateSheetController {
  constructor(private readonly rateSheetService: RateSheetService) {}

  @Get('/list/all')
  @UseAuthGuard()
  @UseFilterFieldsInterceptor()
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
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(RateSheetResponseDto)
  getOneById(@Param('id') id: string): Promise<RateSheet> {
    return this.rateSheetService.getOneById(+id);
  }

  @Get('/list/latest')
  @UseAuthGuard()
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(RateSheetResponseDto)
  getLatestRateSheetsByType(@Query('types') types: string) {
    return this.rateSheetService.getLatestRates(types.split(',') as FeeType[]);
  }

  @Get('/latest')
  @UseAuthGuard()
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(RateSheetResponseDto)
  getLatestRateSheetByType(@Query('type') type: string) {
    return this.rateSheetService.getLatestRate(type as FeeType);
  }

  @Get('/history')
  @UseAuthGuard([UserRole.Treasurer, UserRole.Issuer, UserRole.Admin])
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(RateSheetResponseDto)
  getRateSheetHistoryByType(@Query('type') type: string) {
    return this.rateSheetService.getRateHistory(type as FeeType);
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
