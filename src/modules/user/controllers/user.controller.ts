import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';

import { UseSerializeInterceptor } from '#/common/interceptors/serialize.interceptor';
import { UseFilterFieldsInterceptor } from '#/common/interceptors/filter-fields.interceptor';
import { UserService } from '../services/user.service';
import { UserApprovalStatus, UserRole } from '../enums/user.enum';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UseAuthGuard } from '../guards/auth.guard';
import { User } from '../entities/user.entity';
import { UserCreateDto } from '../dtos/user-create.dto';
import { UserUpdateDto } from '../dtos/user-update.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import {
  UserPasswordForgotDto,
  UserPasswordResetDto,
} from '../dtos/user-password.dto';

const MEMBER_URL = '/members';
const TREASURER_URL = '/treasurers';
const ISSUER_URL = '/issuers';
const ADMIN_URL = '/admins';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  @UseAuthGuard()
  @UseSerializeInterceptor(UserResponseDto)
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Get(`${MEMBER_URL}/:memberEmail`)
  @UseAuthGuard([UserRole.Admin, UserRole.Issuer])
  @UseFilterFieldsInterceptor()
  @UseSerializeInterceptor(UserResponseDto)
  async getMemberByEmail(@Param('memberEmail') email: string) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException('Member not found');
    } else if (user.role !== UserRole.Member) {
      throw new UnauthorizedException();
    }

    return user;
  }

  @Patch()
  @UseAuthGuard()
  @UseSerializeInterceptor(UserResponseDto)
  updateCurrentUser(@Body() body: UserUpdateDto, @CurrentUser() user: User) {
    return this.userService.update(user.id, body);
  }

  @Patch('/approve/:memberId')
  @UseAuthGuard([UserRole.Admin, UserRole.Issuer])
  approveUser(
    @Param('memberId') memberId: string,
    @Body() body: { approvalStatus: UserApprovalStatus },
  ): Promise<{
    approvalStatus: User['approvalStatus'];
    approvalDate: User['approvalDate'];
  }> {
    return this.userService.setApprovalStatus(+memberId, body.approvalStatus);
  }

  @Get(`${MEMBER_URL}/password/verify`)
  passwordVerifyToken(@Query('token') token: string): boolean {
    return this.userService.verifyUserToken(token);
  }

  @Post(`${MEMBER_URL}/password/forgot`)
  passwordForgot(@Body() body: UserPasswordForgotDto): Promise<boolean> {
    const { email } = body;
    return this.userService.sendUserPasswordReset(email);
  }

  @Post(`${MEMBER_URL}/password/reset`)
  passwordReset(
    @Query('token') token: string,
    @Body() body: UserPasswordResetDto,
  ): Promise<boolean> {
    const { password } = body;
    return this.userService.resetUserPassword(token, password);
  }

  // ADMIN

  @Post(`${ADMIN_URL}/register`)
  @UseSerializeInterceptor(UserResponseDto)
  registerAdmin(@Body() body: UserCreateDto): Promise<User> {
    return this.userService.create(body, UserRole.Admin);
  }

  @Patch(`${ADMIN_URL}/:userId`)
  @UseAuthGuard(UserRole.Admin)
  @UseSerializeInterceptor(UserResponseDto)
  async updateUserById(
    @Param('userId') id: string,
    @Body() body: UserUpdateDto,
  ): Promise<User> {
    const user = await this.userService.findOneById(+id);

    if (!user) {
      throw new NotFoundException('User not found');
    } else if (user.role === UserRole.Admin) {
      throw new UnauthorizedException();
    }

    return this.userService.update(+id, body);
  }

  @Delete(`${ADMIN_URL}/:userId`)
  @UseAuthGuard(UserRole.Admin)
  deleteUserById(@Param('userId') id: string): Promise<boolean> {
    return this.userService.delete(+id);
  }

  // ISSUER
  // TODO get list paginated

  @Post(`${ISSUER_URL}/register`)
  @UseSerializeInterceptor(UserResponseDto)
  registerIssuer(@Body() body: UserCreateDto): Promise<User> {
    return this.userService.create(body, UserRole.Issuer);
  }

  @Patch(`${ISSUER_URL}/:memberId`)
  @UseAuthGuard(UserRole.Issuer)
  @UseSerializeInterceptor(UserResponseDto)
  async updateMemberById(
    @Param('userId') id: string,
    @Body() body: UserUpdateDto,
  ): Promise<User> {
    const user = await this.userService.findOneById(+id);

    if (!user) {
      throw new NotFoundException('User not found');
    } else if (user.role !== UserRole.Member) {
      throw new UnauthorizedException();
    }

    return this.userService.update(+id, body);
  }

  // TREASURER

  @Post(`${TREASURER_URL}/register`)
  @UseSerializeInterceptor(UserResponseDto)
  registerTreasurer(@Body() body: UserCreateDto): Promise<User> {
    return this.userService.create(body, UserRole.Treasurer);
  }

  // MEMBER

  @Post(`${MEMBER_URL}/register`)
  @UseSerializeInterceptor(UserResponseDto)
  registerMember(@Body() body: UserCreateDto): Promise<User> {
    return this.userService.create(body, UserRole.Member);
  }
}
