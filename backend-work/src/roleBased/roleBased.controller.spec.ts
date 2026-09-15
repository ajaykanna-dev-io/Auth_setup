import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RoleBasedController } from './roleBased.controller.js';
import { RoleBasedService } from './roleBased.service.js';
import { AppLogger } from '../common/logger.service.js';
import { Role } from './enums/role.enum.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import type { RequestWithUser } from '../auth/guards/jwt-auth.guard.js';

describe('RoleBasedController', () => {
  let controller: RoleBasedController;
  let service: RoleBasedService;

  const mockUsers = [
    {
      id: 1,
      email: 'user@example.com',
      name: 'Regular User',
      username: 'user1',
      role: Role.USER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      email: 'admin@example.com',
      name: 'Admin User',
      username: 'admin1',
      role: Role.ADMIN,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      email: 'manager@example.com',
      name: 'Manager User',
      username: 'manager1',
      role: Role.MANAGER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockRoleBasedService = {
    getOwnProfile: jest.fn((id: number) => {
      const u = mockUsers.find((user) => user.id === id);
      return Promise.resolve(u);
    }),
    findAllUsers: jest.fn(() => Promise.resolve(mockUsers)),
    findUserById: jest.fn((id: number) => {
      const u = mockUsers.find((user) => user.id === id);
      return Promise.resolve(u);
    }),
    updateUserRole: jest.fn((targetUserId: number, newRole: Role) => {
      const u = mockUsers.find((user) => user.id === targetUserId);
      return Promise.resolve({ ...u, role: newRole });
    }),
  };

  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleBasedController],
      providers: [
        { provide: RoleBasedService, useValue: mockRoleBasedService },
        { provide: AppLogger, useValue: mockLogger },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RoleBasedController>(RoleBasedController);
    service = module.get<RoleBasedService>(RoleBasedService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /users/me', () => {
    it('should return own profile for any authenticated user', async () => {
      const req = { user: { sub: 1, email: 'user@example.com', role: Role.USER } } as RequestWithUser;
      const profile = await controller.getOwnProfile(req);
      expect(profile).toEqual(mockUsers[0]);
      expect(service.getOwnProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /users', () => {
    it('should return all users for admin', async () => {
      const req = { user: { sub: 2, email: 'admin@example.com', role: Role.ADMIN } } as RequestWithUser;
      const allUsers = await controller.getAllUsers(req);
      expect(allUsers).toHaveLength(3);
      expect(service.findAllUsers).toHaveBeenCalled();
    });
  });

  describe('GET /users/:id', () => {
    it('should allow user to view their own info', async () => {
      const req = { user: { sub: 1, email: 'user@example.com', role: Role.USER } } as RequestWithUser;
      const user = await controller.getUserById(1, req);
      expect(user).toEqual(mockUsers[0]);
    });

    it('should reject a regular user trying to view another user info', async () => {
      const req = { user: { sub: 1, email: 'user@example.com', role: Role.USER } } as RequestWithUser;
      await expect(controller.getUserById(2, req)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to view any user info', async () => {
      const req = { user: { sub: 2, email: 'admin@example.com', role: Role.ADMIN } } as RequestWithUser;
      const user = await controller.getUserById(1, req);
      expect(user).toEqual(mockUsers[0]);
    });
  });

  describe('PATCH /users/:id/role', () => {
    it('should allow manager to update a user role', async () => {
      const req = { user: { sub: 3, email: 'manager@example.com', role: Role.MANAGER } } as RequestWithUser;
      const response = await controller.updateUserRole(1, { role: Role.ADMIN }, req);
      expect(response.message).toBe('Role updated successfully');
      expect(response.user.role).toBe(Role.ADMIN);
      expect(service.updateUserRole).toHaveBeenCalledWith(1, Role.ADMIN, 3);
    });
  });
});
