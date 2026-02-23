import { pgTable, uuid, text, timestamp, date, integer, boolean } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  barcode: text('barcode').notNull().unique(),
  name: text('name').notNull(),
  category: text('category'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  joinCode: text('join_code').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  nickname: text('nickname').notNull(),
  deviceId: text('device_id').notNull(),
  role: text('role').notNull(), // 'owner' or 'member'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
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
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }),
  createdByMemberId: uuid('created_by_member_id').references(() => members.id, { onDelete: 'set null' }),
  scannedByDeviceId: text('scanned_by_device_id'), // for backward compatibility
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  deviceId: text('device_id').notNull().unique(),
  expoPushToken: text('expo_push_token').notNull(),
  platform: text('platform').notNull(), // 'ios' or 'android'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const notificationSchedules = pgTable('notification_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: text('device_id').notNull().references(() => pushTokens.deviceId, { onDelete: 'cascade' }),
  scheduleType: text('schedule_type').notNull(), // 'weekly' or 'daily'
  dayOfWeek: integer('day_of_week'), // 0-6 for Sunday-Saturday
  timeOfDay: text('time_of_day').notNull(), // HH:MM format
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const batchScans = pgTable('batch_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: text('device_id').notNull(),
  batchName: text('batch_name').notNull(),
  status: text('status').notNull().default('in_progress'), // 'in_progress' or 'completed'
  itemCount: integer('item_count').default(0),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }),
  createdByMemberId: uuid('created_by_member_id').references(() => members.id, { onDelete: 'set null' }),
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
