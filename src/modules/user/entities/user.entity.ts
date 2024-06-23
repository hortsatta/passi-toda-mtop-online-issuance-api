import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

import { Base as BaseEntity } from '#/common/entities/base-entity';
import { Franchise } from '#/modules/franchise/entities/franchise.entity';
import { UserApprovalStatus, UserRole } from '../enums/user.enum';
import { UserProfile } from './user-profile.entity';
import { DriverProfile } from './driver-profile.entity';

@Entity()
export class User extends BaseEntity {
  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserApprovalStatus,
    default: UserApprovalStatus.Pending,
  })
  approvalStatus: UserApprovalStatus;

  @Column({ type: 'timestamp', nullable: true })
  approvalDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSignInDate: Date;

  @OneToOne(() => UserProfile, (userProfile) => userProfile.user, {
    cascade: true,
    eager: true,
  })
  userProfile: UserProfile;

  @OneToMany(() => Franchise, (franchise) => franchise.user)
  franchises: Franchise[];

  @OneToMany(() => DriverProfile, (driverProfile) => driverProfile.user)
  drivers: DriverProfile[];
}
