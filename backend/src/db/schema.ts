import { pgTable, uuid, text, timestamp, date, integer } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  barcode: text('barcode').notNull().unique(),
  name: text('name').notNull(),
  category: text('category'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const productEntries = pgTable('product_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  barcode: text('barcode').notNull(),
  productName: text('product_name').notNull(),
  category: text('category'),
  expirationDate: date('expiration_date', { mode: 'string' }).notNull(),
  quantity: integer('quantity').default(1),
  location: text('location'),
  notes: text('notes'),
  imageUrl: text('image_url'),
  status: text('status').default('fresh').notNull(), // 'fresh', 'expiring_soon', 'expired'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});
