import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileSourceType, SportType } from '../../common/enums';
import { TrackPoint } from '../../trackPoints/entities/track-point.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Index('idx_activities_user_start_time', ['user', 'start_time'])
@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SportType })
  sport_type: SportType;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date;

  @Column({ type: 'integer', nullable: true })
  duration_seconds: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  distance_meters: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  elevation_gain_meters: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  elevation_loss_meters: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  max_speed: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  avg_speed: number | null;

  @Column({ type: 'integer', nullable: true })
  max_heart_rate: number | null;

  @Column({ type: 'integer', nullable: true })
  avg_heart_rate: number | null;

  @Column({ type: 'integer', nullable: true })
  total_calories: number | null;

  @Column({ type: 'enum', enum: FileSourceType })
  file_source_type: FileSourceType;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => TrackPoint, (trackPoint: TrackPoint) => trackPoint.activity)
  trackPoints: TrackPoint[];

  @ManyToOne(() => UserEntity, (user: UserEntity) => user.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
