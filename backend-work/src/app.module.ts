import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { LoggerModule } from './common/logger.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RoleBasedModule } from './roleBased/roleBased.module.js';
import { ProductModule } from './product/product.module.js';
import { AppController } from './app.controller.js';

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
    PrismaModule,
    AuthModule,
    RoleBasedModule,
    ProductModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
