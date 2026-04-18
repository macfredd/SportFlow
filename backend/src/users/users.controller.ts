import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageFileValidatorPipe } from '../common/pipes/image-file-validator.pipe';
import { mimeTypeForAvatarFile } from './utils/avatar-mime.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPublicResponseDto } from './dto/user-public-response.dto';
import { UsersService } from './users.service';
import { UserPreferencesService } from './user-preferences.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserPublicResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Param('id') userId: string,
    @UploadedFile(ImageFileValidatorPipe) file: Express.Multer.File,
  ): Promise<{ userId: string; avatar_key: string }> {
    return this.usersService.updateUserAvatar(userId, file);
  }

  @Get(':id/avatar')
  async getUserAvatar(@Param('id') id: string) {
    const absPath = await this.usersService.resolveAvatarAbsolutePath(id);
    if (!absPath) {
      throw new NotFoundException('Avatar not found');
    }
    const stream = createReadStream(absPath);
    return new StreamableFile(stream, {
      type: mimeTypeForAvatarFile(absPath),
    });
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findUserPublic(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
