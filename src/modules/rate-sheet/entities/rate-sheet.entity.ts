import { Column, Entity, OneToMany } from 'typeorm';

import { Base as BaseEntity } from '#/common/entities/base-entity';
import { FeeType } from '../enums/rate-sheet.enum';
import { RateSheetFee } from './rate-sheet-fee.entity';

@Entity()
export class RateSheet extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: FeeType,
  })
  feeType: FeeType;

  @OneToMany(() => RateSheetFee, (rateSheetFee) => rateSheetFee.rateSheet, {
    cascade: true,
  })
  rateSheetFees: RateSheetFee[];
}
