import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserConfig } from './entities/user-config.entity';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserConfig)
    private readonly userConfigRepository: Repository<UserConfig>,
  ) {}

  async getUserPreferences(userId: string): Promise<UserConfig | null> {
    return this.userConfigRepository.findOne({ where: { user: { id: userId } } });
  }
}