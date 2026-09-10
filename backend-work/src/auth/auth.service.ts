import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { db } from '../prisma/db';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await db.orm.public.User
      .where({ email })
      .first();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // Create user in PostgreSQL via Prisma ORM
    const created = await db.orm.public.User.create({
      email,
      password: hashedPassword,
      ...(dto.name ? { name: dto.name.trim() } : {}),
      ...(dto.username ? { username: dto.username.trim() } : {}),
    });

    const token = await this.signToken(created.id, created.email);

    return {
      message: 'Registration successful',
      token,
      user: {
        id: created.id,
        email: created.email,
        name: created.name,
        username: created.username,
        createdAt: created.createdAt,
      },
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await db.orm.public.User
      .where({ email })
      .first();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.signToken(user.id, user.email);

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await db.orm.public.User
      .where({ id: userId })
      .first();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async signToken(userId: number, email: string): Promise<string> {
    return this.jwtService.signAsync({
      sub: userId,
      email,
    });
  }
}
