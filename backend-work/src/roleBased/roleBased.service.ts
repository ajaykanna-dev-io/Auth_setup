import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { AppLogger } from '../common/logger.service.js';
import { Role } from './enums/role.enum.js';

export interface UserResponse {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class RoleBasedService {
  private readonly context = RoleBasedService.name;

  constructor(
    @Inject(AppLogger) private readonly logger: AppLogger,
  ) {}

  /**
   * Fetch current user's profile
   */
  async getOwnProfile(userId: number): Promise<UserResponse> {
    this.logger.log(`Fetching own profile for userId: ${userId}`, this.context);

    const user = await db.orm.public.User.where({ id: userId }).first();
    if (!user) {
      this.logger.warn(`User profile not found for userId: ${userId}`, this.context);
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * ADMIN: List all users in the system
   */
  async findAllUsers(): Promise<UserResponse[]> {
    this.logger.log(`Listing all users (admin access)`, this.context);

    const users = await db.orm.public.User.all();
    this.logger.debug(`Retrieved ${users.length} users`, this.context);

    return users.map((user) => this.sanitizeUser(user));
  }

  /**
   * Fetch a specific user by ID
   */
  async findUserById(id: number): Promise<UserResponse> {
    this.logger.log(`Fetching user details for id: ${id}`, this.context);

    const user = await db.orm.public.User.where({ id }).first();
    if (!user) {
      this.logger.warn(`User with id: ${id} not found`, this.context);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.sanitizeUser(user);
  }

  /**
   * MANAGER: Modify any user's role
   */
  async updateUserRole(
    targetUserId: number,
    newRole: Role,
    managerId: number,
  ): Promise<UserResponse> {
    this.logger.log(
      `Manager ${managerId} requesting role change for user ${targetUserId} -> ${newRole}`,
      this.context,
    );

    const targetUser = await db.orm.public.User.where({ id: targetUserId }).first();
    if (!targetUser) {
      this.logger.warn(
        `Role change failed: target user ${targetUserId} not found`,
        this.context,
      );
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    const previousRole = targetUser.role;

    // Update in database
    await db.orm.public.User.where({ id: targetUserId }).update({
      role: newRole,
    });

    this.logger.log(
      `Role updated successfully for user ${targetUserId}: "${previousRole}" -> "${newRole}" by manager ${managerId}`,
      this.context,
    );

    const updatedUser = await db.orm.public.User.where({ id: targetUserId }).first();
    return this.sanitizeUser(updatedUser ?? { ...targetUser, role: newRole });
  }

  private sanitizeUser(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      username: user.username ?? null,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
