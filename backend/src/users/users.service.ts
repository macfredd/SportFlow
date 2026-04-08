import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserConfig } from './entities/user-config.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(UserConfig)
    private readonly userConfigRepository: Repository<UserConfig>,
    private readonly configService: ConfigService,
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

  async getUserConfig(id: string): Promise<UserConfig | null> {
    return await this.userConfigRepository.findOne({
      where: { user: { id } },
    });
  }

  async updateUserAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ userId: string; avatar_key: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rawPath = this.configService.getOrThrow<string>('AVATAR_STORAGE_PATH');
    const backendRoot = path.join(__dirname, '..', '..');
    const avatarDir = path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(backendRoot, rawPath);

    await fs.mkdir(avatarDir, { recursive: true });

    const extension = path.extname(file.originalname ?? '').toLowerCase();
    const newKey = `${randomUUID()}${extension}`;
    const newAbsPath = path.join(avatarDir, newKey);

    const buf = file.buffer;
    if (!buf?.length) {
      throw new InternalServerErrorException('File buffer missing');
    }

    if (user.avatar_key) {
      const oldPath = path.join(avatarDir, user.avatar_key);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT') {
          throw new InternalServerErrorException(
            'Could not remove previous avatar file',
          );
        }
      }
    }

    try {
      await fs.writeFile(newAbsPath, buf);
    } catch {
      throw new InternalServerErrorException('Could not save avatar file');
    }

    user.avatar_key = newKey;
    await this.usersRepository.save(user);

    return { userId: user.id, avatar_key: newKey };
  }
}
