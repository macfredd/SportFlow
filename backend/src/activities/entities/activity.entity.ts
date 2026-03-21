import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum SportType {
  WALKING = 'walking',
  RUNNING = 'running',
  CYCLING = 'cycling',
}

export enum FileSourceType {
  FIT = 'FIT',
  TCX = 'TCX',
  GPX = 'GPX',
}

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

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  avg_speed: number | null;

  @Column({ type: 'integer', nullable: true })
  avg_heart_rate: number | null;

  @Column({
    type: 'varchar',
    length: 10,
  })
  file_source_type: FileSourceType;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
