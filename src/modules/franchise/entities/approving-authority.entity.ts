import { Entity, Column } from 'typeorm';

import { Base as BaseEntity } from '#/common/entities/base-entity';
import { ApprovingSignaturePosition } from '../enums/franchise.enum';

@Entity()
export class ApprovingAuthority extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  middleName: string;

  @Column({ type: 'varchar', length: 255 })
  positionName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  departmentName: string;

  @Column({
    type: 'enum',
    enum: ApprovingSignaturePosition,
  })
  signaturePosition: ApprovingSignaturePosition;
}
