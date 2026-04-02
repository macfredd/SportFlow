import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserConfig } from './entities/user-config.entity';
import { UserWeightReading } from './entities/user-weight-reading.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserConfig, UserWeightReading])],
  exports: [TypeOrmModule],
  controllers: [],
  providers: [],
})
export class UsersModule {}
