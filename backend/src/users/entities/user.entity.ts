import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Activity } from '../../activities/entities/activity.entity';
import { UserSex } from '../enums';
import { UserConfig } from './user-config.entity';
import { UserWeightReading } from './user-weight-reading.entity';
import { UserBloodGlucoseReading } from './user-blood-glucose-reading.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date | null;

  @Column({ type: 'enum', enum: UserSex, nullable: true })
  sex: UserSex | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height_cm: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Activity, (activity: Activity) => activity.user)
  activities: Activity[];

  @OneToOne(() => UserConfig, (config: UserConfig) => config.user)
  config: UserConfig;

  @OneToMany(() => UserWeightReading, (weight_reading: UserWeightReading) => weight_reading.user)
  weight_readings: UserWeightReading[];

  @OneToMany(() => UserBloodGlucoseReading, (blood_glucose_reading: UserBloodGlucoseReading) => blood_glucose_reading.user)
  blood_glucose_readings: UserBloodGlucoseReading[];
}