import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller.js';
import { ProductService } from './product.service.js';
import { AppLogger } from '../common/logger.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../roleBased/guards/roles.guard.js';
import type { RequestWithUser } from '../auth/guards/jwt-auth.guard.js';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProducts = [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Ergonomic Mechanical Keyboard',
      description: 'Custom mechanical keyboard with hot-swappable switches',
      price: 129.99,
      stock: 25,
      shippedCount: 5,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
      category: 'Electronics',
      status: 'APPROVED',
      rating: 4.8,
      ratingCount: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockProductService = {
    getPublicProducts: jest.fn(() => Promise.resolve(mockProducts)),
    getAdminProducts: jest.fn(() => Promise.resolve(mockProducts)),
    getProductById: jest.fn((id: string) => Promise.resolve(mockProducts[0])),
    createProduct: jest.fn((adminId: number, dto: any) =>
      Promise.resolve({
        id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        ...dto,
        status: 'PENDING_APPROVAL',
        stock: dto.stock,
        shippedCount: 0,
        rating: 0,
        ratingCount: 0,
        createdBy: adminId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ),
    updateApprovalStatus: jest.fn((id: string, status: 'APPROVED' | 'REJECTED') =>
      Promise.resolve({ ...mockProducts[0], id, status }),
    ),
    deleteProduct: jest.fn((id: string) =>
      Promise.resolve({ message: 'Product deleted successfully', id }),
    ),
    updateStock: jest.fn((id: string, dto: any) =>
      Promise.resolve({ ...mockProducts[0], id, ...dto }),
    ),
    checkout: jest.fn((userId: number, dto: any) =>
      Promise.resolve({
        message: 'Order placed successfully',
        grandTotal: 129.99,
        orders: [],
      }),
    ),
    rateProduct: jest.fn((userId: number, id: string, dto: any) =>
      Promise.resolve({
        message: 'Rating submitted successfully',
        product: { id, rating: 5, ratingCount: 1 },
      }),
    ),
    getUserOrders: jest.fn((userId: number) => Promise.resolve([])),
  };

  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: AppLogger, useValue: mockLogger },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPublicProducts', () => {
    it('should return list of approved products', async () => {
      const result = await controller.getPublicProducts();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Ergonomic Mechanical Keyboard');
    });
  });

  describe('createProduct (admin)', () => {
    it('should create a product with PENDING_APPROVAL status', async () => {
      const req = { user: { sub: 2, role: 'ADMIN', email: 'admin@test.com' } } as unknown as RequestWithUser;
      const dto = {
        title: 'New Mouse',
        description: 'Wireless mouse',
        price: 49.99,
        stock: 50,
      };

      const result = await controller.createProduct(dto, req);
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(result.title).toBe('New Mouse');
      expect(mockProductService.createProduct).toHaveBeenCalledWith(2, dto);
    });
  });

  describe('updateApproval (manager)', () => {
    it('should approve product', async () => {
      const req = { user: { sub: 3, role: 'MANAGER', email: 'mgr@test.com' } } as unknown as RequestWithUser;
      const result = await controller.updateApproval('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', { status: 'APPROVED' }, req);
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('deleteProduct (manager)', () => {
    it('should delete product', async () => {
      const req = { user: { sub: 3, role: 'MANAGER', email: 'mgr@test.com' } } as unknown as RequestWithUser;
      const result = await controller.deleteProduct('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', req);
      expect(result.message).toBe('Product deleted successfully');
    });
  });

  describe('checkout (user)', () => {
    it('should purchase products', async () => {
      const req = { user: { sub: 1, role: 'USER', email: 'user@test.com' } } as unknown as RequestWithUser;
      const dto = {
        items: [{ productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 }],
        shippingAddress: '123 Market St, San Francisco, CA',
      };
      const result = await controller.checkout(dto, req);
      expect(result.message).toBe('Order placed successfully');
    });
  });
});
