import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesModule } from './activities/activities.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrackPointsModule } from './trackPoints/track-points.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: parseInt(configService.getOrThrow('DB_PORT'), 10),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_DATABASE'),
        synchronize:
          configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    ActivitiesModule,
    TrackPointsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
