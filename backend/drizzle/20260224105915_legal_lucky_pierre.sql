CREATE TABLE "store_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"nickname" text NOT NULL,
	"role" text NOT NULL,
	"device_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stores" DROP CONSTRAINT "stores_join_code_unique";--> statement-breakpoint
ALTER TABLE "batch_scans" DROP CONSTRAINT "batch_scans_created_by_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "expiry_batches" DROP CONSTRAINT "expiry_batches_added_by_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_uploaded_by_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primary_image_source_store_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primary_image_source_member_id" uuid;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "store_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_scans" ADD CONSTRAINT "batch_scans_created_by_member_id_store_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."store_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expiry_batches" ADD CONSTRAINT "expiry_batches_added_by_member_id_store_members_id_fk" FOREIGN KEY ("added_by_member_id") REFERENCES "public"."store_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_uploaded_by_member_id_store_members_id_fk" FOREIGN KEY ("uploaded_by_member_id") REFERENCES "public"."store_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "primary_image_source";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "join_code";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_store_code_unique" UNIQUE("store_code");