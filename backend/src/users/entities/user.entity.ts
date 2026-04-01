import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Activity } from '../../activities/entities/activity.entity';

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

  @Column({ type: 'varchar', length: 50, nullable: true })
  sex: string | null;

  /** Última estatura conocida (cm); null si aún no registrada. */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height_cm: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Activity, (activity: Activity) => activity.user)
  activities: Activity[];
}