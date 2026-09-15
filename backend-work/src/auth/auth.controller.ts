import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AppLogger } from '../common/logger.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { RequestWithUser } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  private readonly context = AuthController.name;

  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(AppLogger) private readonly logger: AppLogger,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`POST /auth/register — email: ${dto.email}`, this.context);
    const result = await this.authService.register(dto);
    this.logger.log(`POST /auth/register — completed for email: ${dto.email}`, this.context);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    this.logger.log(`POST /auth/login — email: ${dto.email}`, this.context);
    const result = await this.authService.login(dto);
    this.logger.log(`POST /auth/login — completed for email: ${dto.email}`, this.context);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req: RequestWithUser) {
    this.logger.log(`GET /auth/me — userId: ${req.user.sub}`, this.context);
    const result = await this.authService.getProfile(req.user.sub);
    this.logger.log(`GET /auth/me — completed for userId: ${req.user.sub}`, this.context);
    return result;
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    this.logger.debug('GET /auth/health — health check requested', this.context);
    return {
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    };
  }
}

