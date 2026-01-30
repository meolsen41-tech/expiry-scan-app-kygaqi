import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/upload/product-image - Upload product image
  fastify.post<{}>(
    '/api/upload/product-image',
    {
      schema: {
        description: 'Upload product image',
        tags: ['upload'],
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              filename: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          413: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Uploading product image');

      try {
        const data = await request.file({ limits: { fileSize: 5 * 1024 * 1024 } });

        if (!data) {
          app.logger.warn({}, 'No file provided for upload');
          return reply.status(400).send({ error: 'No file provided' });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err) {
          app.logger.warn({}, 'File size exceeds 5MB limit');
          return reply.status(413).send({ error: 'File too large (max 5MB)' });
        }

        const filename = data.filename;
        const key = `product-images/${Date.now()}-${filename}`;

        app.logger.info({ filename, key }, 'Uploading to storage');

        // Upload to storage
        const uploadedKey = await app.storage.upload(key, buffer);

        // Get signed URL
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        app.logger.info({ key: uploadedKey, filename }, 'Product image uploaded successfully');
        return { url, filename };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to upload product image');
        throw error;
      }
    }
  );
}
