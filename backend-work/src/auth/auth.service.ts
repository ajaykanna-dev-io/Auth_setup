import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { db } from '../prisma/db.js';
import { AppLogger } from '../common/logger.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  private readonly context = AuthService.name;

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(AppLogger) private readonly logger: AppLogger,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    this.logger.log(`Registration attempt for email: ${email}`, this.context);

    // Check if user already exists
    const existingUser = await db.orm.public.User
      .where({ email })
      .first();

    if (existingUser) {
      this.logger.warn(`Registration rejected — duplicate email: ${email}`, this.context);
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // Create user in PostgreSQL via Prisma ORM
    const created = await db.orm.public.User.create({
      email,
      passwordHash: hashedPassword,
      ...(dto.name ? { name: dto.name.trim() } : {}),
      ...(dto.username ? { username: dto.username.trim() } : {}),
    });

    const token = await this.signToken(created.id, created.email, created.role);

    this.logger.log(`User registered successfully — id: ${created.id}, email: ${created.email}`, this.context);

    return {
      message: 'Registration successful',
      token,
      user: {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        username: created.username,
        createdAt: created.createdAt,
      },
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    this.logger.log(`Login attempt for email: ${email}`, this.context);

    const user = await db.orm.public.User
      .where({ email })
      .first();

    if (!user) {
      this.logger.warn(`Login failed — user not found: ${email}`, this.context);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed — invalid password for email: ${email}`, this.context);
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.signToken(user.id, user.email, user.role);

    this.logger.log(`User logged in successfully — id: ${user.id}, email: ${user.email}`, this.context);

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        username: user.username,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(userId: number) {
    this.logger.log(`Fetching profile for userId: ${userId}`, this.context);

    const user = await db.orm.public.User
      .where({ id: userId })
      .first();

    if (!user) {
      this.logger.warn(`Profile not found for userId: ${userId}`, this.context);
      throw new UnauthorizedException('User not found');
    }

    this.logger.debug(`Profile retrieved for userId: ${userId}`, this.context);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async signToken(userId: number, email: string, role: string): Promise<string> {
    this.logger.debug(`Signing JWT for userId: ${userId}, role: ${role}`, this.context);
    return this.jwtService.signAsync({
      sub: userId,
      email,
      role,
    });
  }
}

