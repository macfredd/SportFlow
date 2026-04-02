import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  DistanceUnit,
  GlucoseUnit,
  HeightUnit,
  WeightUnit,
} from '../enums';
import { UserEntity } from './user.entity';

export type DashboardWidgetsConfig = Record<string, { enabled: boolean }>;

@Entity('user_configs')
export class UserConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => UserEntity, (user: UserEntity) => user.config, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'enum', enum: WeightUnit, default: WeightUnit.KG })
  preferred_weight_unit: WeightUnit;

  @Column({ type: 'enum', enum: HeightUnit, default: HeightUnit.CM })
  preferred_height_unit: HeightUnit;

  @Column({ type: 'enum', enum: DistanceUnit, default: DistanceUnit.KM })
  preferred_distance_unit: DistanceUnit;

  @Column({ type: 'enum', enum: GlucoseUnit, default: GlucoseUnit.MG_DL })
  preferred_glucose_unit: GlucoseUnit;

  @Column({ type: 'jsonb', nullable: true })
  dashboard_widgets: DashboardWidgetsConfig | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
