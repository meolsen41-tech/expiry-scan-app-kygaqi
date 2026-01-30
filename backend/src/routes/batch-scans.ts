import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

function calculateStatus(expirationDateStr: string): 'fresh' | 'expiring_soon' | 'expired' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiration = new Date(expirationDateStr);
  expiration.setHours(0, 0, 0, 0);

  const daysUntilExpiration = Math.floor((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration < 0) {
    return 'expired';
  } else if (daysUntilExpiration <= 7) {
    return 'expiring_soon';
  } else {
    return 'fresh';
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/batch-scans - Create new batch scan
  fastify.post<{
    Body: { deviceId: string; batchName: string };
  }>(
    '/api/batch-scans',
    {
      schema: {
        description: 'Create batch scan',
        tags: ['batch-scans'],
        body: {
          type: 'object',
          required: ['deviceId', 'batchName'],
          properties: {
            deviceId: { type: 'string' },
            batchName: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              batchName: { type: 'string' },
              status: { type: 'string' },
              itemCount: { type: 'integer' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { deviceId, batchName } = request.body;
      app.logger.info({ deviceId, batchName }, 'Creating batch scan');

      try {
        const batch = await app.db
          .insert(schema.batchScans)
          .values({
            deviceId,
            batchName,
            status: 'in_progress',
            itemCount: 0,
          })
          .returning();

        app.logger.info({ batchId: batch[0].id }, 'Batch scan created');
        return batch[0];
      } catch (error) {
        app.logger.error({ err: error, deviceId, batchName }, 'Failed to create batch scan');
        throw error;
      }
    }
  );

  // GET /api/batch-scans/:deviceId - Get batch scans for device
  fastify.get<{ Params: { deviceId: string } }>(
    '/api/batch-scans/:deviceId',
    {
      schema: {
        description: 'Get batch scans for device',
        tags: ['batch-scans'],
        params: {
          type: 'object',
          properties: {
            deviceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                batchName: { type: 'string' },
                status: { type: 'string' },
                itemCount: { type: 'integer' },
                createdAt: { type: 'string' },
                completedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { deviceId } = request.params;
      app.logger.info({ deviceId }, 'Fetching batch scans');

      try {
        const batches = await app.db.select().from(schema.batchScans).where(eq(schema.batchScans.deviceId, deviceId));

        app.logger.info({ deviceId, count: batches.length }, 'Batch scans retrieved');
        return batches;
      } catch (error) {
        app.logger.error({ err: error, deviceId }, 'Failed to fetch batch scans');
        throw error;
      }
    }
  );

  // POST /api/batch-scans/:batchId/items - Add item to batch
  fastify.post<{
    Params: { batchId: string };
    Body: {
      barcode: string;
      productName: string;
      expirationDate: string;
      category?: string;
      quantity?: number;
      location?: string;
      notes?: string;
      imageUrl?: string;
    };
  }>(
    '/api/batch-scans/:batchId/items',
    {
      schema: {
        description: 'Add item to batch scan',
        tags: ['batch-scans'],
        params: {
          type: 'object',
          properties: {
            batchId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['barcode', 'productName', 'expirationDate'],
          properties: {
            barcode: { type: 'string' },
            productName: { type: 'string' },
            expirationDate: { type: 'string' },
            category: { type: 'string' },
            quantity: { type: 'integer' },
            location: { type: 'string' },
            notes: { type: 'string' },
            imageUrl: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              item: { type: 'object' },
              batchItemCount: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { batchId } = request.params;
      const { barcode, productName, expirationDate, category, quantity, location, notes, imageUrl } = request.body;
      app.logger.info({ batchId, barcode, productName }, 'Adding item to batch scan');

      try {
        // Verify batch exists
        const batch = await app.db.select().from(schema.batchScans).where(eq(schema.batchScans.id, batchId)).limit(1);

        if (batch.length === 0) {
          app.logger.warn({ batchId }, 'Batch not found');
          return reply.status(404).send({ error: 'Batch not found' });
        }

        if (batch[0].status !== 'in_progress') {
          app.logger.warn({ batchId }, 'Batch is not in progress');
          return reply.status(400).send({ error: 'Batch is not in progress' });
        }

        // Add item to batch
        const item = await app.db
          .insert(schema.batchScanItems)
          .values({
            batchId,
            barcode,
            productName,
            expirationDate,
            category,
            quantity: quantity || 1,
            location,
            notes,
            imageUrl,
          })
          .returning();

        // Update batch item count
        await app.db
          .update(schema.batchScans)
          .set({ itemCount: batch[0].itemCount + 1 })
          .where(eq(schema.batchScans.id, batchId));

        // Get updated item count
        const updatedBatch = await app.db
          .select()
          .from(schema.batchScans)
          .where(eq(schema.batchScans.id, batchId))
          .limit(1);

        app.logger.info(
          { batchId, itemId: item[0].id, batchItemCount: updatedBatch[0].itemCount },
          'Item added to batch scan'
        );
        return { success: true, item: item[0], batchItemCount: updatedBatch[0].itemCount };
      } catch (error) {
        app.logger.error({ err: error, batchId }, 'Failed to add item to batch scan');
        throw error;
      }
    }
  );

  // GET /api/batch-scans/:batchId/items - Get items in batch
  fastify.get<{ Params: { batchId: string } }>(
    '/api/batch-scans/:batchId/items',
    {
      schema: {
        description: 'Get items in batch scan',
        tags: ['batch-scans'],
        params: {
          type: 'object',
          properties: {
            batchId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                barcode: { type: 'string' },
                productName: { type: 'string' },
                expirationDate: { type: 'string' },
                category: { type: 'string' },
                quantity: { type: 'integer' },
                location: { type: 'string' },
                notes: { type: 'string' },
                imageUrl: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { batchId } = request.params;
      app.logger.info({ batchId }, 'Fetching batch scan items');

      try {
        // Verify batch exists
        const batch = await app.db.select().from(schema.batchScans).where(eq(schema.batchScans.id, batchId)).limit(1);

        if (batch.length === 0) {
          app.logger.warn({ batchId }, 'Batch not found');
          return reply.status(404).send({ error: 'Batch not found' });
        }

        const items = await app.db
          .select()
          .from(schema.batchScanItems)
          .where(eq(schema.batchScanItems.batchId, batchId));

        app.logger.info({ batchId, count: items.length }, 'Batch scan items retrieved');
        return items;
      } catch (error) {
        app.logger.error({ err: error, batchId }, 'Failed to fetch batch scan items');
        throw error;
      }
    }
  );

  // POST /api/batch-scans/:batchId/complete - Complete batch and create entries
  fastify.post<{ Params: { batchId: string } }>(
    '/api/batch-scans/:batchId/complete',
    {
      schema: {
        description: 'Complete batch scan and create entries',
        tags: ['batch-scans'],
        params: {
          type: 'object',
          properties: {
            batchId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              entriesCreated: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { batchId } = request.params;
      app.logger.info({ batchId }, 'Completing batch scan');

      try {
        // Verify batch exists
        const batch = await app.db.select().from(schema.batchScans).where(eq(schema.batchScans.id, batchId)).limit(1);

        if (batch.length === 0) {
          app.logger.warn({ batchId }, 'Batch not found');
          return reply.status(404).send({ error: 'Batch not found' });
        }

        if (batch[0].status !== 'in_progress') {
          app.logger.warn({ batchId }, 'Batch is not in progress');
          return reply.status(400).send({ error: 'Batch is not in progress' });
        }

        // Get all items in batch
        const items = await app.db
          .select()
          .from(schema.batchScanItems)
          .where(eq(schema.batchScanItems.batchId, batchId));

        let entriesCreated = 0;

        // Create product entries for each item
        for (const item of items) {
          // Create or get product
          const existingProduct = await app.db
            .select()
            .from(schema.products)
            .where(eq(schema.products.barcode, item.barcode))
            .limit(1);

          let productId: string;
          if (existingProduct.length > 0) {
            productId = existingProduct[0].id;
          } else {
            const created = await app.db
              .insert(schema.products)
              .values({
                barcode: item.barcode,
                name: item.productName,
                category: item.category,
                imageUrl: item.imageUrl,
              })
              .returning();
            productId = created[0].id;
          }

          // Calculate status
          const status = calculateStatus(item.expirationDate);

          // Create product entry
          await app.db
            .insert(schema.productEntries)
            .values({
              productId,
              barcode: item.barcode,
              productName: item.productName,
              category: item.category,
              expirationDate: item.expirationDate,
              quantity: item.quantity,
              location: item.location,
              notes: item.notes,
              imageUrl: item.imageUrl,
              status,
              scannedByDeviceId: batch[0].deviceId,
            });

          entriesCreated++;
        }

        // Mark batch as completed
        await app.db
          .update(schema.batchScans)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(schema.batchScans.id, batchId));

        app.logger.info({ batchId, entriesCreated }, 'Batch scan completed');
        return { success: true, entriesCreated };
      } catch (error) {
        app.logger.error({ err: error, batchId }, 'Failed to complete batch scan');
        throw error;
      }
    }
  );

  // DELETE /api/batch-scans/:batchId - Delete batch
  fastify.delete<{ Params: { batchId: string } }>(
    '/api/batch-scans/:batchId',
    {
      schema: {
        description: 'Delete batch scan',
        tags: ['batch-scans'],
        params: {
          type: 'object',
          properties: {
            batchId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { batchId } = request.params;
      app.logger.info({ batchId }, 'Deleting batch scan');

      try {
        const result = await app.db.delete(schema.batchScans).where(eq(schema.batchScans.id, batchId)).returning();

        if (result.length === 0) {
          app.logger.warn({ batchId }, 'Batch not found for deletion');
          return reply.status(404).send({ error: 'Batch not found' });
        }

        app.logger.info({ batchId }, 'Batch scan deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, batchId }, 'Failed to delete batch scan');
        throw error;
      }
    }
  );
}
