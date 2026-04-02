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

@Index('idx_user_weight_readings_user_recorded', ['user', 'recorded_at'])
@Entity('user_weight_readings')
export class UserWeightReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user: UserEntity) => user.weight_readings, {
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

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
