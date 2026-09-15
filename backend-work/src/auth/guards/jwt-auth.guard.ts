import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AppLogger } from '../../common/logger.service.js';

export interface AuthenticatedUser {
  sub: number;
  email: string;
  role?: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly context = JwtAuthGuard.name;

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(AppLogger) private readonly logger: AppLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      this.logger.warn(`Authorization header missing — ${request.method} ${request.url}`, this.context);
      throw new UnauthorizedException('Authorization header missing');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      this.logger.warn(`Invalid authorization format — ${request.method} ${request.url}`, this.context);
      throw new UnauthorizedException('Invalid authorization format. Expected: Bearer <token>');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthenticatedUser>(token);
      request.user = payload;
      this.logger.debug(`Token verified — userId: ${payload.sub}, ${request.method} ${request.url}`, this.context);
      return true;
    } catch {
      this.logger.warn(`Invalid or expired token — ${request.method} ${request.url}`, this.context);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

