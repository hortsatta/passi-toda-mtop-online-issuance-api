import { Controller, Get, Param, Query } from '@nestjs/common';

import { UseFilterFieldsInterceptor } from '#/common/interceptors/filter-fields.interceptor';
import { UseSerializeInterceptor } from '#/common/interceptors/serialize.interceptor';
import { UserRole } from '../enums/user.enum';
import { UseAuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { DriverProfile } from '../entities/driver-profile.entity';
import { DriverProfileResponseDto } from '../dtos/driver-profile-response.dto';
import { DriverProfileService } from '../services/driver-profile.service';

const MEMBER_URL = '/member';

@Controller('driver-profiles')
export class DriverProfileController {
  constructor(private readonly driverProfileService: DriverProfileService) {}

  @Get(`${MEMBER_URL}/list/all`)
  @UseAuthGuard(UserRole.Member)
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(DriverProfileResponseDto)
  getAllByMemberId(
    @CurrentUser() user: User,
    @Query('ids') ids?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
    @Query('withFranchise') withFranchise?: boolean,
  ): Promise<DriverProfile[]> {
    const transformedIds = ids?.split(',').map((id) => +id);

    return this.driverProfileService.getAllDriverProfilesByMemberId(
      user.id,
      sort,
      transformedIds,
      q,
      withFranchise,
    );
  }

  @Get(`${MEMBER_URL}/:id`)
  @UseAuthGuard([UserRole.Member])
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(DriverProfileResponseDto)
  getOneByIdAndMemberId(@Param('id') id: string, @CurrentUser() user: User) {
    return this.driverProfileService.getOneById(+id, user.id);
  }

  @Get('/:id')
  @UseAuthGuard([UserRole.Treasurer, UserRole.Issuer, UserRole.Admin])
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(DriverProfileResponseDto)
  getOneById(@Param('id') id: string) {
    return this.driverProfileService.getOneById(+id);
  }
}
