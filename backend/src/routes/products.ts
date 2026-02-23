import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and, isNull } from 'drizzle-orm';
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
  // GET /api/products/barcode/:barcode - Look up product by barcode
  fastify.get<{ Params: { barcode: string } }>(
    '/api/products/barcode/:barcode',
    {
      schema: {
        description: 'Look up product by barcode',
        tags: ['products'],
        params: {
          type: 'object',
          properties: {
            barcode: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              barcode: { type: 'string' },
              name: { type: 'string' },
              category: { type: 'string' },
              imageUrl: { type: 'string' },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const { barcode } = request.params;
      app.logger.info({ barcode }, 'Looking up product by barcode');

      const product = await app.db.select().from(schema.products).where(eq(schema.products.barcode, barcode)).limit(1);

      if (product.length === 0) {
        app.logger.info({ barcode }, 'Product not found');
        return reply.status(404).send({ error: 'Product not found' });
      }

      const result = {
        id: product[0].id,
        barcode: product[0].barcode,
        name: product[0].name,
        category: product[0].category,
        imageUrl: product[0].imageUrl,
      };

      app.logger.info({ productId: product[0].id, barcode }, 'Product lookup successful');
      return result;
    }
  );

  // POST /api/products - Create or update product master data
  fastify.post<{ Body: { barcode: string; name: string; category?: string; imageUrl?: string } }>(
    '/api/products',
    {
      schema: {
        description: 'Create or update product master data',
        tags: ['products'],
        body: {
          type: 'object',
          required: ['barcode', 'name'],
          properties: {
            barcode: { type: 'string' },
            name: { type: 'string' },
            category: { type: 'string' },
            imageUrl: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              barcode: { type: 'string' },
              name: { type: 'string' },
              category: { type: 'string' },
              imageUrl: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { barcode, name, category, imageUrl } = request.body;
      app.logger.info({ barcode, name }, 'Creating or updating product');

      try {
        // Check if product exists
        const existing = await app.db
          .select()
          .from(schema.products)
          .where(eq(schema.products.barcode, barcode))
          .limit(1);

        let result;
        if (existing.length > 0) {
          // Update existing product
          const updated = await app.db
            .update(schema.products)
            .set({
              name,
              category: category || existing[0].category,
              imageUrl: imageUrl || existing[0].imageUrl,
              updatedAt: new Date(),
            })
            .where(eq(schema.products.id, existing[0].id))
            .returning();
          result = updated[0];
          app.logger.info({ productId: result.id }, 'Product updated successfully');
        } else {
          // Create new product
          const created = await app.db
            .insert(schema.products)
            .values({
              barcode,
              name,
              category,
              imageUrl,
            })
            .returning();
          result = created[0];
          app.logger.info({ productId: result.id }, 'Product created successfully');
        }

        return result;
      } catch (error) {
        app.logger.error({ err: error, barcode }, 'Failed to create or update product');
        throw error;
      }
    }
  );

  // GET /api/products/entries - Get all product entries sorted by expiration date
  fastify.get<{ Querystring: { storeId?: string } }>(
    '/api/products/entries',
    {
      schema: {
        description: 'Get all product entries',
        tags: ['product-entries'],
        querystring: {
          type: 'object',
          properties: {
            storeId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                productId: { type: 'string' },
                barcode: { type: 'string' },
                productName: { type: 'string' },
                category: { type: 'string' },
                expirationDate: { type: 'string' },
                quantity: { type: 'integer' },
                location: { type: 'string' },
                notes: { type: 'string' },
                imageUrl: { type: 'string' },
                status: { type: 'string' },
                storeId: { type: 'string' },
                createdByMemberId: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { storeId } = request.query;
      app.logger.info({ storeId }, 'Fetching product entries');

      try {
        let entries;

        if (storeId) {
          entries = await app.db
            .select()
            .from(schema.productEntries)
            .where(eq(schema.productEntries.storeId, storeId))
            .orderBy(schema.productEntries.expirationDate);
        } else {
          entries = await app.db
            .select()
            .from(schema.productEntries)
            .orderBy(schema.productEntries.expirationDate);
        }

        app.logger.info({ count: entries.length, storeId }, 'Product entries retrieved successfully');
        return entries;
      } catch (error) {
        app.logger.error({ err: error, storeId }, 'Failed to fetch product entries');
        throw error;
      }
    }
  );

  // POST /api/products/entries - Create a new product entry
  fastify.post<{
    Body: {
      barcode: string;
      productName: string;
      category?: string;
      expirationDate: string;
      quantity?: number;
      location?: string;
      notes?: string;
      imageUrl?: string;
      storeId?: string;
      createdByMemberId?: string;
    };
  }>(
    '/api/products/entries',
    {
      schema: {
        description: 'Create a new product entry',
        tags: ['product-entries'],
        body: {
          type: 'object',
          required: ['barcode', 'productName', 'expirationDate'],
          properties: {
            barcode: { type: 'string' },
            productName: { type: 'string' },
            category: { type: 'string' },
            expirationDate: { type: 'string' },
            quantity: { type: 'integer' },
            location: { type: 'string' },
            notes: { type: 'string' },
            imageUrl: { type: 'string' },
            storeId: { type: 'string' },
            createdByMemberId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              productId: { type: 'string' },
              barcode: { type: 'string' },
              productName: { type: 'string' },
              category: { type: 'string' },
              expirationDate: { type: 'string' },
              quantity: { type: 'integer' },
              location: { type: 'string' },
              notes: { type: 'string' },
              imageUrl: { type: 'string' },
              status: { type: 'string' },
              storeId: { type: 'string' },
              createdByMemberId: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { barcode, productName, category, expirationDate, quantity, location, notes, imageUrl, storeId, createdByMemberId } = request.body;
      app.logger.info(
        { barcode, productName, expirationDate, storeId },
        'Creating product entry'
      );

      try {
        // Create or update product master data
        const existingProduct = await app.db
          .select()
          .from(schema.products)
          .where(eq(schema.products.barcode, barcode))
          .limit(1);

        let productId: string;
        if (existingProduct.length > 0) {
          productId = existingProduct[0].id;
        } else {
          const created = await app.db
            .insert(schema.products)
            .values({
              barcode,
              name: productName,
              category,
              imageUrl,
            })
            .returning();
          productId = created[0].id;
        }

        // Calculate status
        const status = calculateStatus(expirationDate);

        // Create product entry
        const entry = await app.db
          .insert(schema.productEntries)
          .values({
            productId,
            barcode,
            productName,
            category,
            expirationDate,
            quantity: quantity || 1,
            location,
            notes,
            imageUrl,
            status,
            storeId,
            createdByMemberId,
          })
          .returning();

        app.logger.info({ entryId: entry[0].id, status, storeId }, 'Product entry created successfully');
        return entry[0];
      } catch (error) {
        app.logger.error({ err: error, barcode, productName }, 'Failed to create product entry');
        throw error;
      }
    }
  );

  // PUT /api/products/entries/:id - Update product entry
  fastify.put<{
    Params: { id: string };
    Body: {
      productName?: string;
      category?: string;
      expirationDate?: string;
      quantity?: number;
      location?: string;
      notes?: string;
      imageUrl?: string;
    };
  }>(
    '/api/products/entries/:id',
    {
      schema: {
        description: 'Update product entry',
        tags: ['product-entries'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            productName: { type: 'string' },
            category: { type: 'string' },
            expirationDate: { type: 'string' },
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
              id: { type: 'string' },
              productId: { type: 'string' },
              barcode: { type: 'string' },
              productName: { type: 'string' },
              category: { type: 'string' },
              expirationDate: { type: 'string' },
              quantity: { type: 'integer' },
              location: { type: 'string' },
              notes: { type: 'string' },
              imageUrl: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { productName, category, expirationDate, quantity, location, notes, imageUrl } = request.body;
      app.logger.info({ entryId: id }, 'Updating product entry');

      try {
        // Get current entry to preserve unchanged fields
        const currentEntry = await app.db
          .select()
          .from(schema.productEntries)
          .where(eq(schema.productEntries.id, id))
          .limit(1);

        if (currentEntry.length === 0) {
          app.logger.warn({ entryId: id }, 'Product entry not found');
          return reply.status(404).send({ error: 'Product entry not found' });
        }

        const current = currentEntry[0];

        // Determine new status if expiration date changed
        const newExpirationDate = expirationDate || current.expirationDate;
        const newStatus = calculateStatus(newExpirationDate);

        // Update product entry
        const updated = await app.db
          .update(schema.productEntries)
          .set({
            productName: productName || current.productName,
            category: category !== undefined ? category : current.category,
            expirationDate: newExpirationDate,
            quantity: quantity !== undefined ? quantity : current.quantity,
            location: location !== undefined ? location : current.location,
            notes: notes !== undefined ? notes : current.notes,
            imageUrl: imageUrl !== undefined ? imageUrl : current.imageUrl,
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(schema.productEntries.id, id))
          .returning();

        app.logger.info({ entryId: id, status: newStatus }, 'Product entry updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, entryId: id }, 'Failed to update product entry');
        throw error;
      }
    }
  );

  // DELETE /api/products/entries/:id - Delete product entry
  fastify.delete<{ Params: { id: string } }>(
    '/api/products/entries/:id',
    {
      schema: {
        description: 'Delete product entry',
        tags: ['product-entries'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
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
      app.logger.info({ entryId: id }, 'Deleting product entry');

      try {
        const result = await app.db.delete(schema.productEntries).where(eq(schema.productEntries.id, id)).returning();

        if (result.length === 0) {
          app.logger.warn({ entryId: id }, 'Product entry not found for deletion');
          return reply.status(404).send({ error: 'Product entry not found' });
        }

        app.logger.info({ entryId: id }, 'Product entry deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, entryId: id }, 'Failed to delete product entry');
        throw error;
      }
    }
  );

  // GET /api/products/entries/stats - Get statistics
  fastify.get<{}>(
    '/api/products/entries/stats',
    {
      schema: {
        description: 'Get product entry statistics',
        tags: ['product-entries'],
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              fresh: { type: 'integer' },
              expiringSoon: { type: 'integer' },
              expired: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info({}, 'Fetching product entry statistics');

      try {
        const entries = await app.db.select().from(schema.productEntries);

        const stats = {
          total: entries.length,
          fresh: entries.filter((e) => e.status === 'fresh').length,
          expiringSoon: entries.filter((e) => e.status === 'expiring_soon').length,
          expired: entries.filter((e) => e.status === 'expired').length,
        };

        app.logger.info(stats, 'Product entry statistics retrieved successfully');
        return stats;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch statistics');
        throw error;
      }
    }
  );
}
