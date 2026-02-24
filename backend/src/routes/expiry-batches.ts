import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

function calculateStatus(expiryDateStr: string): 'fresh' | 'expiring' | 'expired' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry <= 0) {
    return 'expired';
  } else if (daysUntilExpiry <= 7) {
    return 'expiring';
  } else {
    return 'fresh';
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/expiry-batches - Get expiry batches for store
  fastify.get<{
    Querystring: { storeId: string; status?: string };
  }>(
    '/api/expiry-batches',
    {
      schema: {
        description: 'Get expiry batches for store',
        tags: ['expiry-batches'],
        querystring: {
          type: 'object',
          required: ['storeId'],
          properties: {
            storeId: { type: 'string' },
            status: { type: 'string', enum: ['all', 'fresh', 'expiring', 'expired'] },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                storeId: { type: 'string' },
                barcode: { type: 'string' },
                expiryDate: { type: 'string' },
                quantity: { type: 'integer' },
                addedByMemberId: { type: 'string' },
                addedAt: { type: 'string' },
                note: { type: 'string' },
                productName: { type: 'string' },
                primaryImageUrl: { type: 'string' },
                status: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { storeId, status } = request.query;
      app.logger.info({ storeId, status }, 'Fetching expiry batches');

      try {
        const batches = await app.db
          .select({
            id: schema.expiryBatches.id,
            storeId: schema.expiryBatches.storeId,
            barcode: schema.expiryBatches.barcode,
            expiryDate: schema.expiryBatches.expiryDate,
            quantity: schema.expiryBatches.quantity,
            addedByMemberId: schema.expiryBatches.addedByMemberId,
            addedAt: schema.expiryBatches.addedAt,
            note: schema.expiryBatches.note,
            productName: schema.products.name,
            primaryImageUrl: schema.products.primaryImageUrl,
          })
          .from(schema.expiryBatches)
          .innerJoin(schema.products, eq(schema.expiryBatches.barcode, schema.products.barcode))
          .where(eq(schema.expiryBatches.storeId, storeId));

        // Add calculated status to each batch
        const batchesWithStatus = batches.map((batch) => ({
          ...batch,
          status: calculateStatus(batch.expiryDate),
        }));

        // Filter by status if provided
        let filtered = batchesWithStatus;
        if (status && status !== 'all') {
          filtered = batchesWithStatus.filter((b) => b.status === status);
        }

        app.logger.info({ storeId, count: filtered.length }, 'Expiry batches retrieved successfully');
        return filtered;
      } catch (error) {
        app.logger.error({ err: error, storeId }, 'Failed to fetch expiry batches');
        throw error;
      }
    }
  );

  // POST /api/expiry-batches - Create new expiry batch
  fastify.post<{
    Body: {
      storeId: string;
      barcode: string;
      expiryDate: string;
      quantity: number;
      addedByMemberId: string;
      note?: string;
    };
  }>(
    '/api/expiry-batches',
    {
      schema: {
        description: 'Create new expiry batch',
        tags: ['expiry-batches'],
        body: {
          type: 'object',
          required: ['storeId', 'barcode', 'expiryDate', 'quantity', 'addedByMemberId'],
          properties: {
            storeId: { type: 'string' },
            barcode: { type: 'string' },
            expiryDate: { type: 'string' },
            quantity: { type: 'integer' },
            addedByMemberId: { type: 'string' },
            note: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              storeId: { type: 'string' },
              barcode: { type: 'string' },
              expiryDate: { type: 'string' },
              quantity: { type: 'integer' },
              addedByMemberId: { type: 'string' },
              addedAt: { type: 'string' },
              note: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { storeId, barcode, expiryDate, quantity, addedByMemberId, note } = request.body;
      app.logger.info({ storeId, barcode, expiryDate, quantity }, 'Creating expiry batch');

      try {
        // Ensure product exists
        const existingProduct = await app.db
          .select()
          .from(schema.products)
          .where(eq(schema.products.barcode, barcode))
          .limit(1);

        if (existingProduct.length === 0) {
          await app.db.insert(schema.products).values({ barcode });
        }

        // Create expiry batch
        const batch = await app.db
          .insert(schema.expiryBatches)
          .values({
            storeId,
            barcode,
            expiryDate,
            quantity,
            addedByMemberId,
            note,
          })
          .returning();

        app.logger.info({ batchId: batch[0].id, storeId }, 'Expiry batch created successfully');
        return batch[0];
      } catch (error) {
        app.logger.error({ err: error, storeId, barcode }, 'Failed to create expiry batch');
        throw error;
      }
    }
  );

  // PUT /api/expiry-batches/:id - Update expiry batch
  fastify.put<{
    Params: { id: string };
    Body: {
      storeId: string;
      quantity?: number;
      note?: string;
    };
  }>(
    '/api/expiry-batches/:id',
    {
      schema: {
        description: 'Update expiry batch',
        tags: ['expiry-batches'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['storeId'],
          properties: {
            storeId: { type: 'string' },
            quantity: { type: 'integer' },
            note: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              storeId: { type: 'string' },
              barcode: { type: 'string' },
              expiryDate: { type: 'string' },
              quantity: { type: 'integer' },
              addedByMemberId: { type: 'string' },
              addedAt: { type: 'string' },
              note: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { storeId, quantity, note } = request.body;
      app.logger.info({ id, storeId }, 'Updating expiry batch');

      try {
        // Verify batch exists and belongs to store
        const batch = await app.db
          .select()
          .from(schema.expiryBatches)
          .where(eq(schema.expiryBatches.id, id))
          .limit(1);

        if (batch.length === 0) {
          app.logger.warn({ id }, 'Batch not found');
          return reply.status(404).send({ error: 'Batch not found' });
        }

        if (batch[0].storeId !== storeId) {
          app.logger.warn({ id, storeId }, 'Store ID mismatch');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        // Update batch
        const updated = await app.db
          .update(schema.expiryBatches)
          .set({
            quantity: quantity !== undefined ? quantity : batch[0].quantity,
            note: note !== undefined ? note : batch[0].note,
          })
          .where(eq(schema.expiryBatches.id, id))
          .returning();

        app.logger.info({ id, storeId }, 'Expiry batch updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, id }, 'Failed to update expiry batch');
        throw error;
      }
    }
  );

  // DELETE /api/expiry-batches/:id - Delete expiry batch
  fastify.delete<{
    Params: { id: string };
    Querystring: { storeId: string };
  }>(
    '/api/expiry-batches/:id',
    {
      schema: {
        description: 'Delete expiry batch',
        tags: ['expiry-batches'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          required: ['storeId'],
          properties: {
            storeId: { type: 'string' },
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
      const { id } = request.params;
      const { storeId } = request.query;
      app.logger.info({ id, storeId }, 'Deleting expiry batch');

      try {
        // Verify batch exists and belongs to store
        const batch = await app.db
          .select()
          .from(schema.expiryBatches)
          .where(eq(schema.expiryBatches.id, id))
          .limit(1);

        if (batch.length === 0) {
          app.logger.warn({ id }, 'Batch not found');
          return reply.status(404).send({ error: 'Batch not found' });
        }

        if (batch[0].storeId !== storeId) {
          app.logger.warn({ id, storeId }, 'Store ID mismatch');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        // Delete batch
        await app.db.delete(schema.expiryBatches).where(eq(schema.expiryBatches.id, id));

        app.logger.info({ id, storeId }, 'Expiry batch deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, id }, 'Failed to delete expiry batch');
        throw error;
      }
    }
  );

  // GET /api/expiry-batches/stats - Get statistics for store
  fastify.get<{
    Querystring: { storeId: string };
  }>(
    '/api/expiry-batches/stats',
    {
      schema: {
        description: 'Get expiry batch statistics for store',
        tags: ['expiry-batches'],
        querystring: {
          type: 'object',
          required: ['storeId'],
          properties: {
            storeId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              fresh: { type: 'integer' },
              expiring: { type: 'integer' },
              expired: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { storeId } = request.query;
      app.logger.info({ storeId }, 'Fetching expiry batch statistics');

      try {
        const batches = await app.db
          .select()
          .from(schema.expiryBatches)
          .where(eq(schema.expiryBatches.storeId, storeId));

        const stats = {
          total: batches.length,
          fresh: 0,
          expiring: 0,
          expired: 0,
        };

        for (const batch of batches) {
          const status = calculateStatus(batch.expiryDate);
          if (status === 'fresh') {
            stats.fresh++;
          } else if (status === 'expiring') {
            stats.expiring++;
          } else if (status === 'expired') {
            stats.expired++;
          }
        }

        app.logger.info({ storeId, ...stats }, 'Expiry batch statistics retrieved successfully');
        return stats;
      } catch (error) {
        app.logger.error({ err: error, storeId }, 'Failed to fetch statistics');
        throw error;
      }
    }
  );
}
