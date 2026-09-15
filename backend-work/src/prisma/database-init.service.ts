import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pg from 'pg';
import { AppLogger } from '../common/logger.service.js';

/**
 * Runs on application startup to ensure the database schema exists.
 * Checks for each required table and creates it if missing — no manual
 * migration commands needed during development.
 */
@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly context = DatabaseInitService.name;

  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting database initialization check…', this.context);

    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      this.logger.error('DATABASE_URL is not set — skipping DB init', undefined, this.context);
      return;
    }

    const client = new pg.Client({ connectionString: databaseUrl });

    try {
      await client.connect();
      this.logger.log('Connected to PostgreSQL', this.context);

      await this.ensureUserTable(client);
      await this.ensureProductTable(client);
      await this.ensureOrderTable(client);
      await this.ensureReviewTable(client);

      this.logger.log('Database initialization check complete ✔', this.context);
    } catch (error) {
      this.logger.error(
        `Database initialization failed: ${(error as Error).message}`,
        (error as Error).stack,
        this.context,
      );
    } finally {
      await client.end();
    }
  }

  /**
   * Ensures the "user" table exists in the public schema.
   * Matches the Prisma contract defined in prisma/schema.prisma.
   */
  private async ensureUserTable(client: pg.Client) {
    const tableName = 'user';

    const exists = await this.tableExists(client, tableName);

    if (exists) {
      this.logger.log(`Table "${tableName}" already exists — skipping creation`, this.context);
      return;
    }

    this.logger.log(`Table "${tableName}" not found — creating now…`, this.context);

    // Create the Role enum type if it doesn't already exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MANAGER');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await client.query(`
      CREATE TABLE "public"."user" (
        "id"           SERIAL       PRIMARY KEY,
        "email"        TEXT         NOT NULL UNIQUE,
        "username"     TEXT         UNIQUE,
        "name"         TEXT,
        "passwordHash" TEXT         NOT NULL,
        "role"         "Role"       NOT NULL DEFAULT 'USER',
        "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT now()
      );
    `);

    this.logger.log(`Table "${tableName}" created successfully ✔`, this.context);
  }

  /**
   * Ensures the "product" table exists with UUID primary key.
   */
  private async ensureProductTable(client: pg.Client) {
    const tableName = 'product';
    const exists = await this.tableExists(client, tableName);

    if (exists) {
      this.logger.log(`Table "${tableName}" already exists — skipping creation`, this.context);
      return;
    }

    this.logger.log(`Table "${tableName}" not found — creating now…`, this.context);

    // Ensure pgcrypto extension for gen_random_uuid
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await client.query(`
      CREATE TABLE "public"."product" (
        "id"           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        "title"        TEXT         NOT NULL,
        "description"  TEXT,
        "price"        NUMERIC(10, 2) NOT NULL,
        "stock"        INTEGER      NOT NULL DEFAULT 0,
        "shippedCount" INTEGER      NOT NULL DEFAULT 0,
        "imageUrl"     TEXT,
        "category"     TEXT         NOT NULL DEFAULT 'General',
        "status"       TEXT         NOT NULL DEFAULT 'PENDING_APPROVAL',
        "rating"       NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
        "ratingCount"  INTEGER      NOT NULL DEFAULT 0,
        "createdBy"    INTEGER      REFERENCES "public"."user"("id") ON DELETE SET NULL,
        "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT now()
      );
    `);

    this.logger.log(`Table "${tableName}" created successfully ✔`, this.context);
  }

  /**
   * Ensures the "order" table exists with UUID primary key.
   */
  private async ensureOrderTable(client: pg.Client) {
    const tableName = 'order';
    const exists = await this.tableExists(client, tableName);

    if (exists) {
      this.logger.log(`Table "${tableName}" already exists — skipping creation`, this.context);
      return;
    }

    this.logger.log(`Table "${tableName}" not found — creating now…`, this.context);

    await client.query(`
      CREATE TABLE "public"."order" (
        "id"              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"          INTEGER      NOT NULL REFERENCES "public"."user"("id") ON DELETE CASCADE,
        "productId"       UUID         NOT NULL REFERENCES "public"."product"("id") ON DELETE CASCADE,
        "quantity"        INTEGER      NOT NULL,
        "unitPrice"       NUMERIC(10, 2) NOT NULL,
        "totalAmount"     NUMERIC(10, 2) NOT NULL,
        "status"          TEXT         NOT NULL DEFAULT 'COMPLETED',
        "shippingAddress" TEXT         NOT NULL,
        "createdAt"       TIMESTAMPTZ  NOT NULL DEFAULT now()
      );
    `);

    this.logger.log(`Table "${tableName}" created successfully ✔`, this.context);
  }

  /**
   * Ensures the "product_review" table exists with UUID primary key.
   */
  private async ensureReviewTable(client: pg.Client) {
    const tableName = 'product_review';
    const exists = await this.tableExists(client, tableName);

    if (exists) {
      this.logger.log(`Table "${tableName}" already exists — skipping creation`, this.context);
      return;
    }

    this.logger.log(`Table "${tableName}" not found — creating now…`, this.context);

    await client.query(`
      CREATE TABLE "public"."product_review" (
        "id"         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        "productId"  UUID         NOT NULL REFERENCES "public"."product"("id") ON DELETE CASCADE,
        "userId"     INTEGER      NOT NULL REFERENCES "public"."user"("id") ON DELETE CASCADE,
        "rating"     INTEGER      NOT NULL CHECK (rating >= 1 AND rating <= 5),
        "comment"    TEXT,
        "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now()
      );
    `);

    this.logger.log(`Table "${tableName}" created successfully ✔`, this.context);
  }

  /**
   * Checks whether a table exists in the public schema.
   */
  private async tableExists(client: pg.Client, tableName: string): Promise<boolean> {
    const result = await client.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = $1
       ) AS "exists"`,
      [tableName],
    );

    return result.rows[0]?.exists === true;
  }
}
