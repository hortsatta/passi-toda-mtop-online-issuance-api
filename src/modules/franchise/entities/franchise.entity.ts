import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { Base as BaseEntity } from '#/common/entities/base-entity';
import { User } from '#/modules/user/entities/user.entity';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { TodaAssociation } from './toda-association.entity';

@Entity()
export class Franchise extends BaseEntity {
  @Column({ type: 'varchar', length: 15 })
  mvFileNo: string;

  @Column({ type: 'varchar', length: 7 })
  plateNo: string;

  @Column({ type: 'varchar', length: 11 })
  ownerDriverLicenseNo: string;

  @Column({ type: 'text' })
  vehicleORImgUrl: string;

  @Column({ type: 'text' })
  vehicleCRImgUrl: string;

  @Column({ type: 'text' })
  todaAssocMembershipImgUrl: string;

  @Column({ type: 'text' })
  ownerDriverLicenseNoImgUrl: string;

  @Column({ type: 'text' })
  brgyClearanceImgUrl: string;

  @Column({ type: 'text' })
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

  @ManyToOne(
    () => TodaAssociation,
    (todaAssociation) => todaAssociation.franchises,
  )
  @JoinColumn()
  todaAssociation: TodaAssociation;

  @ManyToOne(() => User, (user) => user.franchises)
  @JoinColumn()
  user: User;
}
