import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { pgPool } from '../prisma/db.js';
import { AppLogger } from '../common/logger.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { RateProductDto } from './dto/rate-product.dto.js';

export interface ProductResponse {
  id: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  shippedCount: number;
  imageUrl: string | null;
  category: string;
  status: string;
  rating: number;
  ratingCount: number;
  createdBy?: number | null;
  creatorEmail?: string | null;
  creatorName?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ProductService {
  private readonly context = ProductService.name;

  constructor(@Inject(AppLogger) private readonly logger: AppLogger) {}

  /**
   * Public: List all approved products for storefront catalog
   */
  async getPublicProducts(): Promise<ProductResponse[]> {
    this.logger.log('Fetching public approved products', this.context);
    const result = await pgPool.query(
      `SELECT id, title, description, price::float, stock, "shippedCount", "imageUrl", category, status, rating::float, "ratingCount", "createdAt", "updatedAt"
       FROM "public"."product"
       WHERE status = 'APPROVED'
       ORDER BY "createdAt" DESC`,
    );
    return result.rows;
  }

  // get all orders

  async getAllOrders(): Promise<ProductResponse[]>{
    this.logger.log('Fetching all products for admin/manager', this.context);
    const result = await pgPool.query(
      `SELECT p.id, p.title, p.description, p.price::float, p.stock, p."shippedCount",
              p."imageUrl", p.category, p.status, p.rating::float, p."ratingCount",
              p."createdBy", p."createdAt", p."updatedAt",
              u.email AS "creatorEmail", u.name AS "creatorName"
       FROM "public"."product" p
       LEFT JOIN "public"."user" u ON p."createdBy" = u.id
       ORDER BY p."createdAt" DESC`,
    );
    return result.rows;
  }

  /**
   * Admin & Manager: List all products including pending and rejected
   */
  async getAdminProducts(): Promise<ProductResponse[]> {
    this.logger.log('Fetching all products for admin/manager', this.context);
    const result = await pgPool.query(
      `SELECT p.id, p.title, p.description, p.price::float, p.stock, p."shippedCount",
              p."imageUrl", p.category, p.status, p.rating::float, p."ratingCount",
              p."createdBy", p."createdAt", p."updatedAt",
              u.email AS "creatorEmail", u.name AS "creatorName"
       FROM "public"."product" p
       LEFT JOIN "public"."user" u ON p."createdBy" = u.id
       ORDER BY p."createdAt" DESC`,
    );
    return result.rows;
  }

  /**
   * Get single product with reviews
   */
  async getProductById(id: string) {
    this.logger.log(`Fetching product with id: ${id}`, this.context);
    const productResult = await pgPool.query(
      `SELECT id, title, description, price::float, stock, "shippedCount", "imageUrl", category, status, rating::float, "ratingCount", "createdAt", "updatedAt"
       FROM "public"."product"
       WHERE id = $1`,
      [id],
    );

    if (productResult.rowCount === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const reviewsResult = await pgPool.query(
      `SELECT r.id, r.rating, r.comment, r."createdAt",
              u.id AS "userId", u.name AS "userName", u.email AS "userEmail"
       FROM "public"."product_review" r
       JOIN "public"."user" u ON r."userId" = u.id
       WHERE r."productId" = $1
       ORDER BY r."createdAt" DESC`,
      [id],
    );

    return {
      ...productResult.rows[0],
      reviews: reviewsResult.rows,
    };
  }

  /**
   * Admin: Add a new product (created with PENDING_APPROVAL status)
   */
  async createProduct(adminId: number, dto: CreateProductDto): Promise<ProductResponse> {
    this.logger.log(`Admin ${adminId} creating product "${dto.title}"`, this.context);
    const result = await pgPool.query(
      `INSERT INTO "public"."product"
         (title, description, price, stock, "shippedCount", "imageUrl", category, status, "createdBy")
       VALUES ($1, $2, $3, $4, 0, $5, $6, 'PENDING_APPROVAL', $7)
       RETURNING id, title, description, price::float, stock, "shippedCount", "imageUrl", category, status, rating::float, "ratingCount", "createdBy", "createdAt", "updatedAt"`,
      [
        dto.title.trim(),
        dto.description?.trim() ?? null,
        dto.price,
        dto.stock,
        dto.imageUrl?.trim() ?? null,
        dto.category?.trim() || 'General',
        adminId,
      ],
    );

    this.logger.log(`Product created with id: ${result.rows[0].id} (PENDING_APPROVAL — awaiting Manager review)`, this.context);
    return result.rows[0];
  }

  /**
   * Manager: Approve or reject product
   */
  async updateApprovalStatus(productId: string, status: 'APPROVED' | 'REJECTED'): Promise<ProductResponse> {
    this.logger.log(`Updating product ${productId} approval status to ${status}`, this.context);
    const result = await pgPool.query(
      `UPDATE "public"."product"
       SET status = $1, "updatedAt" = now()
       WHERE id = $2
       RETURNING id, title, description, price::float, stock, "shippedCount", "imageUrl", category, status, rating::float, "ratingCount", "createdBy", "createdAt", "updatedAt"`,
      [status, productId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Manager: Delete product
   */
  async deleteProduct(productId: string): Promise<{ message: string; id: string }> {
    this.logger.log(`Manager deleting product ${productId}`, this.context);
    const result = await pgPool.query(
      `DELETE FROM "public"."product" WHERE id = $1 RETURNING id`,
      [productId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return { message: 'Product deleted successfully', id: productId };
  }

  /**
   * Admin: Manage inventory stock and shipped counts
   */
  async updateStock(productId: string, dto: UpdateStockDto): Promise<ProductResponse> {
    this.logger.log(`Updating stock for product ${productId}`, this.context);
    
    // Check if product exists
    const existing = await pgPool.query(
      `SELECT stock, "shippedCount" FROM "public"."product" WHERE id = $1`,
      [productId],
    );

    if (existing.rowCount === 0) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const currentStock = existing.rows[0].stock;
    const currentShipped = existing.rows[0].shippedCount;

    const newStock = dto.stock !== undefined ? dto.stock : currentStock;
    const newShipped = dto.shippedCount !== undefined ? dto.shippedCount : currentShipped;

    const result = await pgPool.query(
      `UPDATE "public"."product"
       SET stock = $1, "shippedCount" = $2, "updatedAt" = now()
       WHERE id = $3
       RETURNING id, title, description, price::float, stock, "shippedCount", "imageUrl", category, status, rating::float, "ratingCount", "createdBy", "createdAt", "updatedAt"`,
      [newStock, newShipped, productId],
    );

    return result.rows[0];
  }

  /**
   * User: Checkout & purchase products based on available stocks
   * Decrements stock and increments shipped count atomically
   */
  async checkout(userId: number, dto: CheckoutDto) {
    this.logger.log(`Processing checkout for userId: ${userId}`, this.context);
    const client = await pgPool.connect();

    try {
      await client.query('BEGIN');

      const createdOrders = [];
      let grandTotal = 0;

      for (const item of dto.items) {
        // Lock row for safe concurrent decrement
        const productRes = await client.query(
          `SELECT id, title, price::float, stock, status, "shippedCount"
           FROM "public"."product"
           WHERE id = $1
           FOR UPDATE`,
          [item.productId],
        );

        if (productRes.rowCount === 0) {
          throw new NotFoundException(`Product not found: ${item.productId}`);
        }

        const product = productRes.rows[0];

        if (product.status !== 'APPROVED') {
          throw new BadRequestException(`Product "${product.title}" is currently not available for purchase.`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.title}". Available: ${product.stock}, requested: ${item.quantity}.`,
          );
        }

        const totalAmount = Number((product.price * item.quantity).toFixed(2));
        grandTotal += totalAmount;

        // Atomically decrement stock and increment shippedCount
        await client.query(
          `UPDATE "public"."product"
           SET stock = stock - $1,
               "shippedCount" = "shippedCount" + $1,
               "updatedAt" = now()
           WHERE id = $2`,
          [item.quantity, item.productId],
        );

        // Record order
        const orderRes = await client.query(
          `INSERT INTO "public"."order"
             ("userId", "productId", quantity, "unitPrice", "totalAmount", status, "shippingAddress")
           VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6)
           RETURNING id, "userId", "productId", quantity, "unitPrice"::float, "totalAmount"::float, status, "shippingAddress", "createdAt"`,
          [userId, item.productId, item.quantity, product.price, totalAmount, dto.shippingAddress],
        );

        createdOrders.push({
          ...orderRes.rows[0],
          productTitle: product.title,
        });
      }

      await client.query('COMMIT');

      this.logger.log(`Checkout successful for userId: ${userId} (${createdOrders.length} items)`, this.context);

      return {
        message: 'Order placed successfully',
        grandTotal: Number(grandTotal.toFixed(2)),
        orders: createdOrders,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Checkout failed for userId: ${userId}: ${(error as Error).message}`, undefined, this.context);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * User: Rate product (1-5 stars) and optionally write a review
   */
  async rateProduct(userId: number, productId: string, dto: RateProductDto) {
    this.logger.log(`User ${userId} rating product ${productId} with ${dto.rating} stars`, this.context);

    // Verify product exists
    const prod = await pgPool.query(`SELECT id FROM "public"."product" WHERE id = $1`, [productId]);
    if (prod.rowCount === 0) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Insert review
    await pgPool.query(
      `INSERT INTO "public"."product_review" ("productId", "userId", rating, comment)
       VALUES ($1, $2, $3, $4)`,
      [productId, userId, dto.rating, dto.comment?.trim() ?? null],
    );

    // Recalculate average rating and count
    const statsRes = await pgPool.query(
      `SELECT AVG(rating)::numeric(3, 2) AS avg_rating, COUNT(*)::int AS total_count
       FROM "public"."product_review"
       WHERE "productId" = $1`,
      [productId],
    );

    const newAvg = Number(statsRes.rows[0].avg_rating) || dto.rating;
    const newCount = statsRes.rows[0].total_count;

    const updatedProduct = await pgPool.query(
      `UPDATE "public"."product"
       SET rating = $1, "ratingCount" = $2, "updatedAt" = now()
       WHERE id = $3
       RETURNING id, title, rating::float, "ratingCount"`,
      [newAvg, newCount, productId],
    );

    return {
      message: 'Rating submitted successfully',
      product: updatedProduct.rows[0],
    };
  }

  /**
   * User: View own order history
   */
  async getUserOrders(userId: number) {
    this.logger.log(`Fetching orders for user ${userId}`, this.context);
    const result = await pgPool.query(
      `SELECT o.id, o."productId", o.quantity, o."unitPrice"::float, o."totalAmount"::float,
              o.status, o."shippingAddress", o."createdAt",
              p.title AS "productTitle", p."imageUrl" AS "productImage"
       FROM "public"."order" o
       JOIN "public"."product" p ON o."productId" = p.id
       WHERE o."userId" = $1
       ORDER BY o."createdAt" DESC`,
      [userId],
    );

    return result.rows;
  }
}
