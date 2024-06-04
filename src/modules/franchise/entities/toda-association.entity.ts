import { Column, Entity, OneToMany } from 'typeorm';

import { Base as BaseEntity } from '#/common/entities/base-entity';
import { Franchise } from './franchise.entity';

@Entity()
export class TodaAssociation extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  authorizedRoute: string;

  @Column({ type: 'varchar', length: 50 })
  presidentFirstName: string;

  @Column({ type: 'varchar', length: 50 })
  presidentLastName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  presidentMiddleName: string;

  @OneToMany(() => Franchise, (franchise) => franchise.todaAssociation)
  franchises: Franchise[];
}
