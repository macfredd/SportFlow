import {
  BadRequestException,
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
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPublicResponseDto } from './dto/user-public-response.dto';
import { UserConfig } from './entities/user-config.entity';
import { UserEntity } from './entities/user.entity';
import { HeightUnit } from './enums';
import { buildHeightForPublic } from './height-display.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(UserConfig)
    private readonly userConfigRepository: Repository<UserConfig>,
    private readonly configService: ConfigService,
  ) {}

  private getPublicApiBase(): string {
    return this.configService
      .getOrThrow<string>('PUBLIC_API_URL')
      .replace(/\/+$/, '');
  }

  private getAvatarDir(): string {
    const rawPath = this.configService.getOrThrow<string>('AVATAR_STORAGE_PATH');
    const backendRoot = path.join(__dirname, '..', '..');
    return path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(backendRoot, rawPath);
  }

  private toPublicUser(user: UserEntity): UserPublicResponseDto {
    const base = this.getPublicApiBase();
    const heightUnit =
      user.config?.preferred_height_unit ?? HeightUnit.CM;
    const height = buildHeightForPublic(user.height_cm, heightUnit);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      date_of_birth: user.date_of_birth,
      sex: user.sex,
      height,
      nationality: user.nationality ?? null,
      avatar_url: user.avatar_key
        ? `${base}/users/${user.id}/avatar`
        : null,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async findUserPublic(id: string): Promise<UserPublicResponseDto | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['config'],
    });
    if (!user) return null;
    return this.toPublicUser(user);
  }

  /** Absolute path to avatar file, or null if user/avatar/file missing. */
  async resolveAvatarAbsolutePath(userId: string): Promise<string | null> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.avatar_key) return null;
    const avatarDir = this.getAvatarDir();
    const absPath = path.join(avatarDir, user.avatar_key);
    try {
      await fs.access(absPath);
      return absPath;
    } catch {
      return null;
    }
  }

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
        nationality: dto.nationality?.trim() || null,
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

  /**
   * Applies only fields present in the DTO (undefined keys are ignored).
   */
  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserPublicResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['config'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const patch = this.buildPatchFromUpdateDto(dto);
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (
      patch.email !== undefined &&
      patch.email !== null &&
      patch.email !== user.email
    ) {
      const existing = await this.usersRepository.findOne({
        where: { email: patch.email },
      });
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Email already registered');
      }
    }

    Object.assign(user, patch);
    await this.usersRepository.save(user);

    return this.toPublicUser(user);
  }

  private buildPatchFromUpdateDto(dto: UpdateUserDto): Partial<UserEntity> {
    const p: Partial<UserEntity> = {};
    if (dto.name !== undefined) {
      p.name = dto.name;
    }
    if (dto.email !== undefined) {
      p.email = dto.email ?? null;
    }
    if (dto.dateOfBirth !== undefined) {
      p.date_of_birth = dto.dateOfBirth
        ? new Date(`${dto.dateOfBirth}T12:00:00.000Z`)
        : null;
    }
    if (dto.sex !== undefined) {
      p.sex = dto.sex ?? null;
    }
    if (dto.height_cm !== undefined) {
      p.height_cm = dto.height_cm ?? null;
    }
    if (dto.nationality !== undefined) {
      p.nationality = dto.nationality?.trim() || null;
    }
    return p;
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

    const avatarDir = this.getAvatarDir();
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
