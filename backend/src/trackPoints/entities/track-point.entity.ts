import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Activity } from '../../activities/entities/activity.entity';

@Entity('track_points')
export class TrackPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ type: 'timestamptz' })
  date_time: Date;

  @Column({ type: 'integer', nullable: true })
  cadence: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 14, default: 0 })
  position_latitude: number;

  @Column({ type: 'decimal', precision: 18, scale: 14, default: 0 })
  position_longitude: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  speed_m_s: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  altitude_meters: number;

  @Column({ type: 'integer', nullable: true })
  elapsed_time_seconds: number | null;

  @Column({ type: 'integer', nullable: true })
  heart_rate: number | null;
}
