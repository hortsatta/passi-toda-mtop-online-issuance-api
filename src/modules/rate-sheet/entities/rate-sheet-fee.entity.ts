import { Entity, Column, ManyToOne } from 'typeorm';

import { Base as BaseEntity } from '#/common/entities/base-entity';
import { RateSheet } from './rate-sheet.entity';

@Entity()
export class RateSheetFee extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'bigint' })
  amount: number;

  @ManyToOne(() => RateSheet, (rateSheet) => rateSheet.rateSheetFees, {
    onDelete: 'CASCADE',
  })
  rateSheet: RateSheet;
}
