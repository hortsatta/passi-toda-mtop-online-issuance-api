import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { Base as BaseEntity } from '#/common/entities/base-entity';
import { Franchise } from './franchise.entity';
import { FranchiseRenewal } from './franchise-renewal.entity';

@Entity()
export class FranchiseStatusRemark extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  fieldName: string;

  @Column({ type: 'text' })
  remark: string;

  @ManyToOne(() => Franchise, (franchise) => franchise.franchiseStatusRemarks)
  @JoinColumn()
  franchise: Franchise;

  @ManyToOne(
    () => FranchiseRenewal,
    (franchiseRenewal) => franchiseRenewal.franchiseStatusRemarks,
  )
  @JoinColumn()
  franchiseRenewal: FranchiseRenewal;
}
