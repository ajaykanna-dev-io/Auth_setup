import { jest } from '@jest/globals';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Role } from '../enums/role.enum.js';
import { AppLogger } from '../../common/logger.service.js';
import { db } from '../../prisma/db.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let logger: AppLogger;

  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  } as unknown as AppLogger;

  const createMockContext = (user?: any, url = '/users', method = 'GET'): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          url,
          method,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector, mockLogger);
    jest.clearAllMocks();
  });

  it('should allow access if no roles are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ sub: 1, email: 'user@example.com' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if no user is present in request', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException if user does not have the required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
      first: jest.fn().mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        role: Role.USER,
      }),
    } as any);

    const context = createMockContext({ sub: 1, email: 'user@example.com' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access if user has the required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
      first: jest.fn().mockResolvedValue({
        id: 2,
        email: 'admin@example.com',
        role: Role.ADMIN,
      }),
    } as any);

    const context = createMockContext({ sub: 2, email: 'admin@example.com' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow access for MANAGER on manager routes', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.MANAGER]);
    jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
      first: jest.fn().mockResolvedValue({
        id: 3,
        email: 'manager@example.com',
        role: Role.MANAGER,
      }),
    } as any);

    const context = createMockContext({ sub: 3, email: 'manager@example.com' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
