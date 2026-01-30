CREATE TABLE "product_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"barcode" text NOT NULL,
	"product_name" text NOT NULL,
	"category" text,
	"expiration_date" date NOT NULL,
	"quantity" integer DEFAULT 1,
	"location" text,
	"notes" text,
	"image_url" text,
	"status" text DEFAULT 'fresh' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barcode" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
ALTER TABLE "product_entries" ADD CONSTRAINT "product_entries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;