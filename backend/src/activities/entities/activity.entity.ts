import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileSourceType, SportType } from '../../common/enums';
import { TrackPoint } from '../../trackPoints/entities/track-point.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  sport_type: SportType;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date;

  @Column({ type: 'integer' })
  duration_seconds: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  distance_meters: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  elevation_gain_meters: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  elevation_loss_meters: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  max_speed: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  avg_speed: number | null;

  @Column({ type: 'integer', nullable: true })
  max_heart_rate: number | null;

  @Column({ type: 'integer', nullable: true })
  avg_heart_rate: number | null;

  @Column({ type: 'integer', nullable: true })
  total_calories: number | null;

  @Column({
    type: 'varchar',
    length: 10,
  })
  file_source_type: FileSourceType;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => TrackPoint, (trackPoint: TrackPoint) => trackPoint.activity)
  trackPoints: TrackPoint[];
}
