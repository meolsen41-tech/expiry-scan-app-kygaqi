CREATE TABLE "expiry_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"barcode" text NOT NULL,
	"expiry_date" date NOT NULL,
	"quantity" integer NOT NULL,
	"added_by_member_id" uuid NOT NULL,
	"note" text,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barcode" text NOT NULL,
	"image_url" text NOT NULL,
	"uploaded_by_store_id" uuid NOT NULL,
	"uploaded_by_member_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_entries" DROP CONSTRAINT "product_entries_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_barcode_unique";
--> statement-breakpoint
ALTER TABLE "product_entries" DROP COLUMN "product_id";
--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "category";
--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "image_url";
--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "updated_at";
--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "id";
--> statement-breakpoint
ALTER TABLE "products" ADD PRIMARY KEY ("barcode");
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "name" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primary_image_url" text;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primary_image_source" text;
--> statement-breakpoint
ALTER TABLE "expiry_batches" ADD CONSTRAINT "expiry_batches_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expiry_batches" ADD CONSTRAINT "expiry_batches_barcode_products_barcode_fk" FOREIGN KEY ("barcode") REFERENCES "public"."products"("barcode") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expiry_batches" ADD CONSTRAINT "expiry_batches_added_by_member_id_members_id_fk" FOREIGN KEY ("added_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_barcode_products_barcode_fk" FOREIGN KEY ("barcode") REFERENCES "public"."products"("barcode") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_uploaded_by_store_id_stores_id_fk" FOREIGN KEY ("uploaded_by_store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_uploaded_by_member_id_members_id_fk" FOREIGN KEY ("uploaded_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;