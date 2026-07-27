import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1721800000000 implements MigrationInterface {
  name = 'InitSchema1721800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY,
        "name" varchar(120) NOT NULL,
        "description" text NOT NULL,
        "price_in_cents" bigint NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'COP',
        "image_url" varchar(500) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid PRIMARY KEY,
        "full_name" varchar(150) NOT NULL,
        "email" varchar(150) NOT NULL,
        "document_type" varchar(10) NOT NULL,
        "document_number" varchar(30) NOT NULL,
        "phone_number" varchar(20) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_customer_email_document" ON "customers" ("email", "document_number");`,
    );

    await queryRunner.query(`
      CREATE TABLE "stock_items" (
        "id" uuid PRIMARY KEY,
        "product_id" uuid NOT NULL,
        "available_quantity" int NOT NULL,
        "reserved_quantity" int NOT NULL DEFAULT 0,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_stock_product" UNIQUE ("product_id"),
        CONSTRAINT "chk_available_non_negative" CHECK ("available_quantity" >= 0),
        CONSTRAINT "chk_reserved_non_negative" CHECK ("reserved_quantity" >= 0),
        CONSTRAINT "fk_stock_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY,
        "transaction_number" varchar(30) NOT NULL,
        "product_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "product_amount_in_cents" bigint NOT NULL,
        "base_fee_in_cents" bigint NOT NULL,
        "delivery_fee_in_cents" bigint NOT NULL,
        "total_amount_in_cents" bigint NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'COP',
        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "gateway_transaction_id" varchar(100),
        "gateway_status_raw" jsonb,
        "card_brand" varchar(20),
        "card_last_four" varchar(4),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_transaction_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id"),
        CONSTRAINT "fk_transaction_customer" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id")
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_transaction_number" ON "transactions" ("transaction_number");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transaction_status" ON "transactions" ("status");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transaction_customer" ON "transactions" ("customer_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transaction_gateway_id" ON "transactions" ("gateway_transaction_id");`,
    );

    await queryRunner.query(`
      CREATE TABLE "deliveries" (
        "id" uuid PRIMARY KEY,
        "transaction_id" uuid NOT NULL,
        "address_line" varchar(200) NOT NULL,
        "city" varchar(100) NOT NULL,
        "region" varchar(100) NOT NULL,
        "postal_code" varchar(20),
        "country" varchar(2) NOT NULL DEFAULT 'CO',
        "delivery_fee_in_cents" bigint NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_delivery_transaction" UNIQUE ("transaction_id"),
        CONSTRAINT "fk_delivery_transaction" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "deliveries";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_items";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products";`);
  }
}
