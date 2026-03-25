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

  @Column({ type: 'decimal', precision: 18, scale: 14, nullable: true })
  position_latitude: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 14, nullable: true })
  position_longitude: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  speed_m_s: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  altitude_meters: number | null;

  @Column({ type: 'integer', nullable: true })
  elapsed_time_seconds: number | null;

  @Column({ type: 'integer', nullable: true })
  heart_rate: number | null;
}
