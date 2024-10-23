import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { Base as BaseEntity } from '#/common/entities/base-entity';
import { User } from '#/modules/user/entities/user.entity';
import { DriverProfile } from '#/modules/user/entities/driver-profile.entity';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { TodaAssociation } from './toda-association.entity';
import { FranchiseStatusRemark } from './franchise-status-remark.entity';
import { FranchiseRenewal } from './franchise-renewal.entity';

@Entity()
export class Franchise extends BaseEntity {
  @Column({ type: 'varchar', length: 15 })
  mvFileNo: string;

  @Column({ type: 'text' })
  vehicleMake: string;

  @Column({ type: 'varchar', length: 25 })
  vehicleMotorNo: string;

  @Column({ type: 'varchar', length: 17 })
  vehicleChassisNo: string;

  @Column({ type: 'varchar', length: 7 })
  plateNo: string;

  @Column({ type: 'text' })
  vehicleORImgUrl: string;

  @Column({ type: 'text' })
  vehicleCRImgUrl: string;

  @Column({ type: 'text' })
  todaAssocMembershipImgUrl: string;

  @Column({ type: 'text' })
  driverLicenseNoImgUrl: string;

  @Column({ type: 'text' })
  brgyClearanceImgUrl: string;

  @Column({ type: 'text' })
  ctcCedulaImgUrl: string;

  @Column({ type: 'text', nullable: true })
  voterRegRecordImgUrl: string;

  @Column({
    type: 'enum',
    enum: FranchiseApprovalStatus,
    default: FranchiseApprovalStatus.PendingValidation,
  })
  approvalStatus: FranchiseApprovalStatus;

  @Column({ type: 'timestamp', nullable: true })
  approvalDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentORNo: string;

  @ManyToOne(
    () => TodaAssociation,
    (todaAssociation) => todaAssociation.franchises,
  )
  @JoinColumn()
  todaAssociation: TodaAssociation;

  @Column({ type: 'boolean' })
  isDriverOwner: boolean;

  @ManyToOne(() => DriverProfile, (driverProfile) => driverProfile.franchises, {
    nullable: true,
  })
  @JoinColumn()
  driverProfile: DriverProfile;

  @OneToMany(
    () => FranchiseStatusRemark,
    (franchiseStatusRemark) => franchiseStatusRemark.franchise,
    { cascade: true, nullable: true },
  )
  franchiseStatusRemarks: FranchiseStatusRemark[];

  @OneToMany(
    () => FranchiseRenewal,
    (franchiseRenewal) => franchiseRenewal.franchise,
  )
  franchiseRenewals: FranchiseRenewal[];

  @ManyToOne(() => User, (user) => user.franchises)
  @JoinColumn()
  user: User;
}
