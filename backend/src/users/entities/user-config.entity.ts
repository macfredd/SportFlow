import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
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

  @Column({ type: 'varchar', length: 10, default: 'kg' })
  preferred_weight_unit: string;

  @Column({ type: 'varchar', length: 10, default: 'cm' })
  preferred_height_unit: string;

  @Column({ type: 'varchar', length: 10, default: 'km' })
  preferred_distance_unit: string;

  @Column({ type: 'varchar', length: 10, default: 'mg_dl' })
  preferred_glucose_unit: string;

  @Column({ type: 'jsonb', nullable: true })
  dashboard_widgets: DashboardWidgetsConfig | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
