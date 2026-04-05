import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':id/config')
  getUserConfig(@Param('id') id: string) {
    return this.usersService.getUserConfig(id);
  }
}
