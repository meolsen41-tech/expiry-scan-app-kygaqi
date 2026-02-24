import { pgTable, uuid, text, timestamp, date, integer, boolean } from 'drizzle-orm/pg-core';

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  storeCode: text('store_code').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const storeMembers = pgTable('store_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  nickname: text('nickname').notNull(),
  role: text('role').notNull(), // 'admin' or 'staff'
  deviceId: text('device_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  barcode: text('barcode').primaryKey(),
  name: text('name'),
  primaryImageUrl: text('primary_image_url'),
  primaryImageSourceStoreId: uuid('primary_image_source_store_id'),
  primaryImageSourceMemberId: uuid('primary_image_source_member_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  barcode: text('barcode').notNull().references(() => products.barcode, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  uploadedByStoreId: uuid('uploaded_by_store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  uploadedByMemberId: uuid('uploaded_by_member_id').notNull().references(() => storeMembers.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expiryBatches = pgTable('expiry_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  barcode: text('barcode').notNull().references(() => products.barcode, { onDelete: 'cascade' }),
  expiryDate: date('expiry_date', { mode: 'string' }).notNull(),
  quantity: integer('quantity').notNull(),
  note: text('note'),
  addedByMemberId: uuid('added_by_member_id').notNull().references(() => storeMembers.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow().notNull(),
});

// Legacy tables for backward compatibility - can be removed after migration
export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  nickname: text('nickname').notNull(),
  deviceId: text('device_id').notNull(),
  role: text('role').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const productEntries = pgTable('product_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  barcode: text('barcode').notNull(),
  productName: text('product_name').notNull(),
  category: text('category'),
  expirationDate: date('expiration_date', { mode: 'string' }).notNull(),
  quantity: integer('quantity').default(1),
  location: text('location'),
  notes: text('notes'),
  imageUrl: text('image_url'),
  status: text('status').default('fresh').notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }),
  createdByMemberId: uuid('created_by_member_id').references(() => members.id, { onDelete: 'set null' }),
  scannedByDeviceId: text('scanned_by_device_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  deviceId: text('device_id').notNull().unique(),
  expoPushToken: text('expo_push_token').notNull(),
  platform: text('platform').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const notificationSchedules = pgTable('notification_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: text('device_id').notNull().references(() => pushTokens.deviceId, { onDelete: 'cascade' }),
  scheduleType: text('schedule_type').notNull(),
  dayOfWeek: integer('day_of_week'),
  timeOfDay: text('time_of_day').notNull(),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const batchScans = pgTable('batch_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: text('device_id').notNull(),
  batchName: text('batch_name').notNull(),
  status: text('status').notNull().default('in_progress'),
  itemCount: integer('item_count').default(0),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }),
  createdByMemberId: uuid('created_by_member_id').references(() => storeMembers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const batchScanItems = pgTable('batch_scan_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').notNull().references(() => batchScans.id, { onDelete: 'cascade' }),
  barcode: text('barcode').notNull(),
  productName: text('product_name').notNull(),
  expirationDate: date('expiration_date', { mode: 'string' }).notNull(),
  category: text('category'),
  quantity: integer('quantity').default(1),
  location: text('location'),
  notes: text('notes'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
