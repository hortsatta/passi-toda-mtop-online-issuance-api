import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { encryptPassword } from './helpers/password.helper';
import { UserApprovalStatus, UserRole } from './enums/user.enum';
import { User } from './entities/user.entity';
import { UserCreateDto } from './dtos/user-create.dto';
import { UserUpdateDto } from './dtos/user-update.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  // TODO get members paginated

  async findOneById(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  async findOneByEmail(email: string) {
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
      approvalStatus: UserApprovalStatus.Approved,
    });

    return this.userRepo.save(newUser);
  }

  async update(id: number, userDto: UserUpdateDto): Promise<User> {
    const { userProfile } = userDto;
    // Get existing user, return error if user row does not exist
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.userRepo.save({
      ...user,
      userProfile,
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
