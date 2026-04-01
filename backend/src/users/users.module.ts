import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  exports: [TypeOrmModule],
  controllers: [],
  providers: [],
})
export class UsersModule {}
