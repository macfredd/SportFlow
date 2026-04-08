import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageFileValidatorPipe } from '../common/pipes/image-file-validator.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Param('id') userId: string,
    @UploadedFile(ImageFileValidatorPipe) file: Express.Multer.File | undefined,
  ) {
    console.log('[avatar] received', {
      userId,
      fieldname: file?.fieldname,
      originalname: file?.originalname,
      encoding: file?.encoding,
      mimetype: file?.mimetype,
      size: file?.size,
    });

    return { ok: true, userId };
  }

  @Get(':id/config')
  getUserConfig(@Param('id') id: string) {
    return this.usersService.getUserConfig(id);
  }
}
