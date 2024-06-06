import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { Base as BaseEntity } from '#/common/entities/base-entity';
import { UserGender } from '../enums/user.enum';
import { User } from './user.entity';

@Entity()
export class UserProfile extends BaseEntity {
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

  @Column({
    type: 'enum',
    enum: UserGender,
  })
  gender: UserGender;

  @Column({ type: 'varchar', length: 11 })
  driverLicenseNo: string;

  @OneToOne(() => User, (user) => user.userProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
