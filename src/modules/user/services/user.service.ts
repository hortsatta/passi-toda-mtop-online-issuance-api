import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { encryptPassword } from '../helpers/password.helper';
import { UserApprovalStatus, UserRole } from '../enums/user.enum';
import { User } from '../entities/user.entity';
import { UserCreateDto } from '../dtos/user-create.dto';
import { UserUpdateDto } from '../dtos/user-update.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  // TODO get members paginated

  async sendUserEmailConfirmation(email: string, firstName?: string) {
    const token = this.jwtService.sign(
      { email },
      { secret: this.configService.get<string>('JWT_SECRET') },
    );

    const url = `${this.configService.get<string>('APP_BASE_URL')}/register/confirm?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to eTODAMO! Confirm your Email',
      template: './auth-register-confirmation',
      context: {
        name: firstName || email,
        url,
      },
    });
  }

  verifyUserToken(token: string): boolean {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const email = decoded.email;

      if (!email)
        throw new BadRequestException(
          'Cannot reset password. Token is invalid',
        );

      return true;
    } catch (error) {
      throw new BadRequestException('Cannot reset password. Token is invalid');
    }
  }

  async sendUserPasswordReset(email: string): Promise<boolean> {
    const token = this.jwtService.sign(
      { email },
      { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '1h' },
    );

    const url = `${this.configService.get<string>('APP_BASE_URL')}/password/reset?token=${token}`;
    const user = await this.findOneByEmail(email);

    if (!user) throw new ConflictException('Email does not exist');

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your password',
      template: './user-password-forgot',
      context: {
        name: user.userProfile.firstName || email,
        url,
      },
    });

    return true;
  }

  async resetUserPassword(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const email = decoded.email;
      const user = await this.userRepo.findOne({ where: { email } });

      if (!user) {
        throw new BadRequestException('Cannot reset password');
      }

      await this.updatePassword(user.id, newPassword);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password has been reset',
        template: './user-password-reset',
        context: {
          name: user.userProfile.firstName || email,
        },
      });

      return true;
    } catch (error) {
      throw new BadRequestException('Cannot reset password. Token is invalid');
    }
  }

  async findOneById(id: number): Promise<User> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.userRepo.findOne({ where: { email } });
  }

  async create(userDto: UserCreateDto, role: UserRole): Promise<User> {
    const { email, password, userProfile } = userDto;
    // Check if email is existing, if true then cancel creation
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (!!existingUser) throw new ConflictException('Email is already taken');
    // Secure password
    const encryptedPassword = await encryptPassword(password);
    // Create and save user details
    const newUser = this.userRepo.create({
      email,
      password: encryptedPassword,
      role,
      userProfile,
      approvalStatus: UserApprovalStatus.Pending,
    });

    try {
      const user = await this.userRepo.save(newUser);
      await this.sendUserEmailConfirmation(
        user.email,
        user.userProfile.firstName,
      );
      return user;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('An error occurred');
    }
  }

  async update(id: number, userDto: UserUpdateDto): Promise<User> {
    const { userProfile } = userDto;
    // Get existing user, return error if user row does not exist
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.userRepo.save({
      ...user,
      userProfile: { ...user.userProfile, ...userProfile },
    });
  }

  async updatePassword(id: number, newPassword: string): Promise<User> {
    // Get existing user, return error if no password or user row does not exist
    const user = await this.userRepo.findOne({ where: { id } });
    if (!newPassword || !user) throw new NotFoundException('User not found');
    // Secure password
    const encryptedPassword = await encryptPassword(newPassword);

    return this.userRepo.save({
      ...user,
      password: encryptedPassword,
    });
  }

  async setApprovalStatus(
    id: number,
    approvalStatus: UserApprovalStatus,
  ): Promise<{
    approvalStatus: User['approvalStatus'];
    approvalDate: User['approvalDate'];
  }> {
    const user = await this.userRepo.findOne({ where: { id } });
    // Return error if user row does not exist
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.userRepo.save({
      ...user,
      approvalStatus,
    });

    return { approvalStatus, approvalDate: updatedUser.approvalDate };
  }

  async delete(id: number): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id } });
    // Return error if user row does not exist
    if (!user) {
      throw new NotFoundException('User not found');
    } else if (user.role === UserRole.Admin) {
      throw new UnauthorizedException('Cannot delete user');
    }

    const result = await this.userRepo.delete({ id });
    return !!result.affected;
  }
}
