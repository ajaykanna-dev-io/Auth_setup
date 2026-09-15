import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RoleBasedController } from './roleBased.controller.js';
import { RoleBasedService } from './roleBased.service.js';
import { RolesGuard } from './guards/roles.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [RoleBasedController],
  providers: [RoleBasedService, RolesGuard],
  exports: [RoleBasedService, RolesGuard],
})
export class RoleBasedModule {}
