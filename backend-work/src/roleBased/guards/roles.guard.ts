import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { Role } from '../enums/role.enum.js';
import { db } from '../../prisma/db.js';
import { AppLogger } from '../../common/logger.service.js';
import type { RequestWithUser } from '../../auth/guards/jwt-auth.guard.js';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly context = RolesGuard.name;

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AppLogger) private readonly logger: AppLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authUser = request.user;

    if (!authUser || !authUser.sub) {
      this.logger.warn(
        `RolesGuard check failed — no authenticated user found on request`,
        this.context,
      );
      throw new UnauthorizedException('Authentication required');
    }

    // Query the database to get the user's latest role (handles dynamic role changes by manager immediately)
    const user = await db.orm.public.User.where({ id: authUser.sub }).first();

    if (!user) {
      this.logger.warn(
        `RolesGuard check failed — user ${authUser.sub} does not exist in database`,
        this.context,
      );
      throw new UnauthorizedException('User not found');
    }

    // Attach latest role to the request user object
    request.user.role = user.role;

    const hasRole = requiredRoles.some((role) => role === user.role);

    if (!hasRole) {
      this.logger.warn(
        `Access forbidden for user ${user.id} (${user.email}) with role "${user.role}". Required roles: [${requiredRoles.join(', ')}] — ${request.method} ${request.url}`,
        this.context,
      );
      throw new ForbiddenException(
        `Access denied. Requires one of roles: ${requiredRoles.join(', ')}`,
      );
    }

    this.logger.debug(
      `Role authorized for user ${user.id} (${user.role}) on ${request.method} ${request.url}`,
      this.context,
    );

    return true;
  }
}
