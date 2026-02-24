import type { FastifyInstance } from 'fastify';
import { eq, isNull } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/products/:barcode - Fetch product by barcode
  fastify.get<{ Params: { barcode: string } }>(
    '/api/products/:barcode',
    {
      schema: {
        description: 'Fetch product by barcode',
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
              barcode: { type: 'string' },
              name: { type: 'string' },
              primaryImageUrl: { type: 'string' },
              primaryImageSource: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const { barcode } = request.params;
      app.logger.info({ barcode }, 'Fetching product');

      try {
        const product = await app.db.select().from(schema.products).where(eq(schema.products.barcode, barcode)).limit(1);

        if (product.length === 0) {
          app.logger.info({ barcode }, 'Product not found');
          return reply.status(404).send({ error: 'Product not found' });
        }

        app.logger.info({ barcode }, 'Product retrieved successfully');
        return product[0];
      } catch (error) {
        app.logger.error({ err: error, barcode }, 'Failed to fetch product');
        throw error;
      }
    }
  );

  // POST /api/products - Create new product
  fastify.post<{
    Body: {
      barcode: string;
      name?: string;
    };
  }>(
    '/api/products',
    {
      schema: {
        description: 'Create new product',
        tags: ['products'],
        body: {
          type: 'object',
          required: ['barcode'],
          properties: {
            barcode: { type: 'string' },
            name: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              barcode: { type: 'string' },
              name: { type: 'string' },
              primaryImageUrl: { type: 'string' },
              primaryImageSource: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { barcode, name } = request.body;
      app.logger.info({ barcode, name }, 'Creating product');

      try {
        const existing = await app.db.select().from(schema.products).where(eq(schema.products.barcode, barcode)).limit(1);

        if (existing.length > 0) {
          app.logger.info({ barcode }, 'Product already exists');
          return existing[0];
        }

        const product = await app.db
          .insert(schema.products)
          .values({
            barcode,
            name,
          })
          .returning();

        app.logger.info({ barcode }, 'Product created successfully');
        return product[0];
      } catch (error) {
        app.logger.error({ err: error, barcode }, 'Failed to create product');
        throw error;
      }
    }
  );

  // PUT /api/products/:barcode - Update product name
  fastify.put<{
    Params: { barcode: string };
    Body: { name: string };
  }>(
    '/api/products/:barcode',
    {
      schema: {
        description: 'Update product name',
        tags: ['products'],
        params: {
          type: 'object',
          properties: {
            barcode: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              barcode: { type: 'string' },
              name: { type: 'string' },
              primaryImageUrl: { type: 'string' },
              primaryImageSource: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { barcode } = request.params;
      const { name } = request.body;
      app.logger.info({ barcode, name }, 'Updating product name');

      try {
        const existing = await app.db.select().from(schema.products).where(eq(schema.products.barcode, barcode)).limit(1);

        if (existing.length === 0) {
          app.logger.warn({ barcode }, 'Product not found');
          return reply.status(404).send({ error: 'Product not found' });
        }

        // Only update if current name is null/empty
        if (existing[0].name) {
          app.logger.warn({ barcode }, 'Product name already set');
          return reply.status(400).send({ error: 'Product name already set' });
        }

        const updated = await app.db
          .update(schema.products)
          .set({ name })
          .where(eq(schema.products.barcode, barcode))
          .returning();

        app.logger.info({ barcode }, 'Product name updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, barcode }, 'Failed to update product');
        throw error;
      }
    }
  );

  // GET /api/products/:barcode/images - Fetch all images for product
  fastify.get<{ Params: { barcode: string } }>(
    '/api/products/:barcode/images',
    {
      schema: {
        description: 'Fetch all images for product',
        tags: ['products'],
        params: {
          type: 'object',
          properties: {
            barcode: { type: 'string' },
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
                imageUrl: { type: 'string' },
                uploadedByStoreId: { type: 'string' },
                uploadedByMemberId: { type: 'string' },
                createdAt: { type: 'string' },
                isPrimary: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { barcode } = request.params;
      app.logger.info({ barcode }, 'Fetching product images');

      try {
        const images = await app.db
          .select()
          .from(schema.productImages)
          .where(eq(schema.productImages.barcode, barcode))
          .orderBy(schema.productImages.isPrimary, schema.productImages.createdAt);

        app.logger.info({ barcode, count: images.length }, 'Product images retrieved successfully');
        return images;
      } catch (error) {
        app.logger.error({ err: error, barcode }, 'Failed to fetch product images');
        throw error;
      }
    }
  );

  // POST /api/products/:barcode/images - Upload image for product
  fastify.post<{
    Params: { barcode: string };
  }>(
    '/api/products/:barcode/images',
    {
      schema: {
        description: 'Upload image for product',
        tags: ['products'],
        params: {
          type: 'object',
          properties: {
            barcode: { type: 'string' },
          },
        },
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              barcode: { type: 'string' },
              imageUrl: { type: 'string' },
              uploadedByStoreId: { type: 'string' },
              uploadedByMemberId: { type: 'string' },
              createdAt: { type: 'string' },
              isPrimary: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { barcode } = request.params;
      app.logger.info({ barcode }, 'Uploading product image');

      try {
        let storeId: string | null = null;
        let memberId: string | null = null;
        let imageBuffer: Buffer | null = null;
        let filename: string | null = null;

        // Process multipart form data
        const parts = request.parts();
        for await (const part of parts) {
          if (part.type === 'field') {
            if (part.fieldname === 'storeId') {
              storeId = part.value as string;
            } else if (part.fieldname === 'memberId') {
              memberId = part.value as string;
            }
          } else if (part.type === 'file') {
            filename = part.filename;
            try {
              imageBuffer = await part.toBuffer();
              // Check file size limit (5MB)
              if (imageBuffer.length > 5 * 1024 * 1024) {
                app.logger.warn({ barcode }, 'File size exceeds 5MB limit');
                return reply.status(413).send({ error: 'File too large (max 5MB)' });
              }
            } catch (err) {
              app.logger.error({ err, barcode }, 'Error reading file');
              return reply.status(400).send({ error: 'Error reading file' });
            }
          }
        }

        if (!imageBuffer || !filename) {
          app.logger.warn({ barcode }, 'No file provided for upload');
          return reply.status(400).send({ error: 'No file provided' });
        }

        if (!storeId || !memberId) {
          app.logger.warn({ barcode }, 'Missing store or member ID');
          return reply.status(400).send({ error: 'Missing store or member ID' });
        }

        const key = `product-images/${barcode}/${Date.now()}-${filename}`;

        // Upload to storage
        const uploadedKey = await app.storage.upload(key, imageBuffer);
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        // Create product if doesn't exist
        const existingProduct = await app.db
          .select()
          .from(schema.products)
          .where(eq(schema.products.barcode, barcode))
          .limit(1);

        if (existingProduct.length === 0) {
          await app.db.insert(schema.products).values({ barcode });
        }

        // Check if this is the first image
        const existingImages = await app.db
          .select()
          .from(schema.productImages)
          .where(eq(schema.productImages.barcode, barcode));

        const isPrimary = existingImages.length === 0;

        // Create image record
        const image = await app.db
          .insert(schema.productImages)
          .values({
            barcode,
            imageUrl: url,
            uploadedByStoreId: storeId,
            uploadedByMemberId: memberId,
            isPrimary,
          })
          .returning();

        // Update product primary image if this is the first
        if (isPrimary) {
          await app.db
            .update(schema.products)
            .set({
              primaryImageUrl: url,
              primaryImageSourceStoreId: storeId,
              primaryImageSourceMemberId: memberId,
            })
            .where(eq(schema.products.barcode, barcode));
        }

        app.logger.info({ barcode, imageId: image[0].id, isPrimary }, 'Product image uploaded successfully');
        return image[0];
      } catch (error) {
        app.logger.error({ err: error, barcode }, 'Failed to upload product image');
        throw error;
      }
    }
  );
}
