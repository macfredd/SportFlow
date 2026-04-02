import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Index('idx_user_blood_glucose_readings_user_recorded', ['user', 'recorded_at'])
@Entity('user_blood_glucose_readings')
export class UserBloodGlucoseReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user: UserEntity) => user.blood_glucose_readings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'timestamptz' })
  recorded_at: Date;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  value: number;

  @Column({ type: 'varchar', length: 10 })
  unit: string;

  /** e.g. fasting, before_meal, after_meal, random */
  @Column({ type: 'varchar', length: 30, nullable: true })
  context: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
