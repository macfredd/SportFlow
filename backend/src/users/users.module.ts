import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserConfig } from './entities/user-config.entity';
import { UserWeightReading } from './entities/user-weight-reading.entity';
import { UserBloodGlucoseReading } from './entities/user-blood-glucose-reading.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ImageFileValidatorPipe } from 'src/common/pipes/image-file-validator.pipe';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserConfig,
      UserWeightReading,
      UserBloodGlucoseReading,
    ]),
  ],
  exports: [TypeOrmModule],
  controllers: [UsersController],
  providers: [UsersService, ImageFileValidatorPipe],
})
export class UsersModule {}
