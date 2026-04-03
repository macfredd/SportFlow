import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserConfig } from './entities/user-config.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    if (dto.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email already registered');
      }
    }

    const dateOfBirth = dto.dateOfBirth
      ? new Date(`${dto.dateOfBirth}T12:00:00.000Z`)
      : null;

    return this.usersRepository.manager.transaction(async (manager) => {
      const user = manager.create(UserEntity, {
        name: dto.name,
        email: dto.email ?? null,
        date_of_birth: dateOfBirth,
        sex: dto.sex ?? null,
        height_cm: dto.height_cm ?? null,
      });
      const savedUser = await manager.save(user);

      const config = manager.create(UserConfig, { user: savedUser });
      await manager.save(config);

      return savedUser;
    });
  }
}
