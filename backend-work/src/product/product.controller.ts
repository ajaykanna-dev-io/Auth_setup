import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { RequestWithUser } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../roleBased/guards/roles.guard.js';
import { Roles } from '../roleBased/decorators/roles.decorator.js';
import { Role } from '../roleBased/enums/role.enum.js';
import { AppLogger } from '../common/logger.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { ApproveProductDto } from './dto/approve-product.dto.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { RateProductDto } from './dto/rate-product.dto.js';

@Controller('products')
export class ProductController {
  private readonly context = ProductController.name;

  constructor(
    @Inject(ProductService) private readonly productService: ProductService,
    @Inject(AppLogger) private readonly logger: AppLogger,
  ) {}

  /**
   * GET /products
   * Public: Display all approved products on root storefront
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getPublicProducts() {
    this.logger.log('GET /products — public catalog request', this.context);
    return this.productService.getPublicProducts();
  }

  /**
   * GET /products/admin/all
   * ADMIN & MANAGER: View all products (including pending & rejected)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('admin/all')
  @HttpCode(HttpStatus.OK)
  async getAdminProducts(@Request() req: RequestWithUser) {
    this.logger.log(
      `GET /products/admin/all — requested by userId: ${req.user.sub} (role: ${req.user.role})`,
      this.context,
    );
    return this.productService.getAdminProducts();
  }

  @UseGuards(JwtAuthGuard)
  @Get('all-orders')
  @HttpCode(HttpStatus.OK)
  async getAllOrders(@Request() req: RequestWithUser) {
    this.logger.log(
      `GET /products/all-orders — requested by userId: ${req.user.sub} (role: ${req.user.role})`,
      this.context,
    );
    return this.productService.getAllOrders();
  }

  /**
   * GET /products/user/orders
   * USER: Get own order history
   */
  @UseGuards(JwtAuthGuard)
  @Get('user/orders')
  @HttpCode(HttpStatus.OK)
  async getUserOrders(@Request() req: RequestWithUser) {
    this.logger.log(
      `GET /products/user/orders — requested by userId: ${req.user.sub}`,
      this.context,
    );
    return this.productService.getUserOrders(req.user.sub);
  }

  /**
   * GET /products/:id
   * Public: View single product details and reviews
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getProductById(@Param('id') id: string) {
    this.logger.log(`GET /products/${id} — product details request`, this.context);
    return this.productService.getProductById(id);
  }

  /**
   * POST /products
   * ADMIN: Add product (created with PENDING_APPROVAL status)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(
    @Body() dto: CreateProductDto,
    @Request() req: RequestWithUser,
  ) {
    this.logger.log(
      `POST /products — admin ${req.user.sub} creating product: ${dto.title}`,
      this.context,
    );
    return this.productService.createProduct(req.user.sub, dto);
  }

  /**
   * PATCH /products/:id/approval
   * MANAGER: Approve or reject product (Manager only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  @Patch(':id/approval')
  @HttpCode(HttpStatus.OK)
  async updateApproval(
    @Param('id') id: string,
    @Body() dto: ApproveProductDto,
    @Request() req: RequestWithUser,
  ) {
    this.logger.log(
      `PATCH /products/${id}/approval — user ${req.user.sub} (${req.user.role}) setting status to ${dto.status}`,
      this.context,
    );
    return this.productService.updateApprovalStatus(id, dto.status);
  }

  /**
   * DELETE /products/:id
   * ADMIN & MANAGER: Delete product
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteProduct(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    this.logger.log(
      `DELETE /products/${id} — user ${req.user.sub} (${req.user.role}) deleting product`,
      this.context,
    );
    return this.productService.deleteProduct(id);
  }

  /**
   * PATCH /products/:id/stock
   * ADMIN: Manage stock and shipped count
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/stock')
  @HttpCode(HttpStatus.OK)
  async updateStock(
    @Param('id') id: string,
    @Body() dto: UpdateStockDto,
    @Request() req: RequestWithUser,
  ) {
    this.logger.log(
      `PATCH /products/${id}/stock — admin ${req.user.sub} updating stock`,
      this.context,
    );
    return this.productService.updateStock(id, dto);
  }

  /**
   * POST /products/checkout
   * USER: Purchase products based on stock
   */
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(
    @Body() dto: CheckoutDto,
    @Request() req: RequestWithUser,
  ) {
    this.logger.log(
      `POST /products/checkout — user ${req.user.sub} checking out ${dto.items.length} items`,
      this.context,
    );
    return this.productService.checkout(req.user.sub, dto);
  }

  /**
   * POST /products/:id/rate
   * USER: Rate a product (1-5) and submit review
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/rate')
  @HttpCode(HttpStatus.CREATED)
  async rateProduct(
    @Param('id') id: string,
    @Body() dto: RateProductDto,
    @Request() req: RequestWithUser,
  ) {
    this.logger.log(
      `POST /products/${id}/rate — user ${req.user.sub} rating: ${dto.rating} stars`,
      this.context,
    );
    return this.productService.rateProduct(req.user.sub, id, dto);
  }
}
