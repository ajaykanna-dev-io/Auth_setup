import { Module } from '@nestjs/common';
import { ProductController } from './product.controller.js';
import { ProductService } from './product.service.js';
import { LoggerModule } from '../common/logger.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../roleBased/guards/roles.guard.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [LoggerModule, PrismaModule, AuthModule],
  controllers: [ProductController],
  providers: [ProductService, RolesGuard],
  exports: [ProductService],
})
export class ProductModule {}
