import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { Base as BaseEntity } from '#/common/entities/base-entity';
import { Franchise } from '#/modules/franchise/entities/franchise.entity';
import { UserCivilStatus, UserGender } from '../enums/user.enum';
import { User } from './user.entity';

@Entity()
export class DriverProfile extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  middleName: string;

  @Column({ type: 'timestamp' })
  birthDate: Date;

  @Column({ type: 'varchar', length: 11 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255 })
  religion: string;

  @Column({ type: 'text' })
  address: string;

  @Column({
    type: 'enum',
    enum: UserGender,
  })
  gender: UserGender;

  @Column({
    type: 'enum',
    enum: UserCivilStatus,
  })
  civilStatus: UserCivilStatus;

  @Column({ type: 'varchar', length: 11, nullable: true })
  driverLicenseNo: string;

  @ManyToOne(() => User, (user) => user.drivers)
  @JoinColumn()
  user: User;

  @OneToMany(() => Franchise, (franchise) => franchise.driverProfile)
  franchises: Franchise[];
}
