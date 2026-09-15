import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RoleBasedService } from './roleBased.service.js';
import { Roles } from './decorators/roles.decorator.js';
import { Role } from './enums/role.enum.js';
import { RolesGuard } from './guards/roles.guard.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { RequestWithUser } from '../auth/guards/jwt-auth.guard.js';
import { AppLogger } from '../common/logger.service.js';

@Controller('users')
export class RoleBasedController {
  private readonly context = RoleBasedController.name;

  constructor(
    @Inject(RoleBasedService) private readonly roleBasedService: RoleBasedService,
    @Inject(AppLogger) private readonly logger: AppLogger,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getOwnProfile(@Request() req: RequestWithUser) {
    this.logger.log(`GET /users/me — requested by userId: ${req.user.sub}`, this.context);
    const profile = await this.roleBasedService.getOwnProfile(req.user.sub);
    this.logger.log(`GET /users/me — profile returned for userId: ${req.user.sub}`, this.context);
    return profile;
  }

  /**
   * GET /users
   * ADMIN & MANAGER: View all users' info
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllUsers(@Request() req: RequestWithUser) {
    this.logger.log(
      `GET /users — admin access requested by userId: ${req.user.sub}`,
      this.context,
    );
    const users = await this.roleBasedService.findAllUsers();
    this.logger.log(`GET /users — returned ${users.length} users`, this.context);
    return users;
  }

  /**
   * GET /users/:id
   * USER can only view their own info
   * ADMIN & MANAGER can view any user's info
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    this.logger.log(
      `GET /users/${id} — requested by userId: ${req.user.sub} (role: ${req.user.role})`,
      this.context,
    );

    // If requester is a regular USER, restrict to viewing only their own details
    if (req.user.role === Role.USER && req.user.sub !== id) {
      this.logger.warn(
        `Access denied: user ${req.user.sub} attempted to view user ${id}'s profile`,
        this.context,
      );
      throw new ForbiddenException(
        'Access denied: You are only allowed to view your own information',
      );
    }

    const user = await this.roleBasedService.findUserById(id);
    return user;
  }

  /**
   * PATCH /users/:id/role
   * MANAGER ONLY: Modify any user's role at any time
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @Request() req: RequestWithUser,
  ) {
    this.logger.log(
      `PATCH /users/${id}/role — manager ${req.user.sub} changing role to ${dto.role}`,
      this.context,
    );

    const result = await this.roleBasedService.updateUserRole(
      id,
      dto.role,
      req.user.sub,
    );

    this.logger.log(
      `PATCH /users/${id}/role — successfully updated user ${id} role to ${dto.role}`,
      this.context,
    );

    return {
      message: 'Role updated successfully',
      user: result,
    };
  }
}
