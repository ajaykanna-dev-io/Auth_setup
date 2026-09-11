import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { LoggerModule } from './common/logger.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),

    LoggerModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
