import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

function generateStoreCode(): string {
  // Characters to use: uppercase letters and numbers, excluding O, 0, I, 1, L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';

  // Generate 3 chars + 4 chars format (8 total with dash)
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/stores - Create new store
  fastify.post<{
    Body: {
      name: string;
      deviceId: string;
      nickname: string;
    };
  }>(
    '/api/stores',
    {
      schema: {
        description: 'Create a new store',
        tags: ['stores'],
        body: {
          type: 'object',
          required: ['name', 'deviceId', 'nickname'],
          properties: {
            name: { type: 'string' },
            deviceId: { type: 'string' },
            nickname: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              storeCode: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, deviceId, nickname } = request.body;
      app.logger.info({ name, deviceId }, 'Creating store');

      try {
        let storeCode = generateStoreCode();
        let codeExists = true;
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure unique store code
        while (codeExists && attempts < maxAttempts) {
          const existing = await app.db
            .select()
            .from(schema.stores)
            .where(eq(schema.stores.storeCode, storeCode))
            .limit(1);

          if (existing.length === 0) {
            codeExists = false;
          } else {
            storeCode = generateStoreCode();
            attempts++;
          }
        }

        if (codeExists) {
          app.logger.error({ name }, 'Failed to generate unique store code');
          return reply.status(500).send({ error: 'Failed to generate store code' });
        }

        // Create store
        const store = await app.db
          .insert(schema.stores)
          .values({
            name,
            storeCode,
          })
          .returning();

        const storeId = store[0].id;

        // Add creator as admin
        await app.db
          .insert(schema.storeMembers)
          .values({
            storeId,
            nickname,
            deviceId,
            role: 'admin',
          });

        app.logger.info({ storeId, storeCode }, 'Store created successfully');
        return store[0];
      } catch (error) {
        app.logger.error({ err: error, name, deviceId }, 'Failed to create store');
        throw error;
      }
    }
  );

  // POST /api/stores/join - Join store with store code
  fastify.post<{
    Body: {
      storeCode: string;
      deviceId: string;
      nickname: string;
    };
  }>(
    '/api/stores/join',
    {
      schema: {
        description: 'Join store with store code',
        tags: ['stores'],
        body: {
          type: 'object',
          required: ['storeCode', 'deviceId', 'nickname'],
          properties: {
            storeCode: { type: 'string' },
            deviceId: { type: 'string' },
            nickname: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              storeCode: { type: 'string' },
              role: { type: 'string' },
              memberId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { storeCode, deviceId, nickname } = request.body;
      app.logger.info({ storeCode, deviceId }, 'Joining store');

      try {
        // Find store with store code (case-insensitive)
        const store = await app.db
          .select()
          .from(schema.stores)
          .where(eq(schema.stores.storeCode, storeCode.toUpperCase()))
          .limit(1);

        if (store.length === 0) {
          app.logger.warn({ storeCode }, 'Invalid store code');
          return reply.status(404).send({ error: 'Invalid store code' });
        }

        const storeId = store[0].id;

        // Check if device is already a member
        const existingMember = await app.db
          .select()
          .from(schema.storeMembers)
          .where(eq(schema.storeMembers.deviceId, deviceId))
          .limit(1);

        if (existingMember.length > 0 && existingMember[0].storeId === storeId) {
          app.logger.warn({ storeId, deviceId }, 'Device is already a store member');
          return reply.status(400).send({ error: 'Already a member of this store' });
        }

        // Add device as staff member
        const member = await app.db
          .insert(schema.storeMembers)
          .values({
            storeId,
            nickname,
            deviceId,
            role: 'staff',
          })
          .returning();

        app.logger.info({ storeId, deviceId }, 'Device joined store successfully');
        return {
          id: store[0].id,
          name: store[0].name,
          storeCode: store[0].storeCode,
          role: member[0].role,
          memberId: member[0].id,
        };
      } catch (error) {
        app.logger.error({ err: error, storeCode, deviceId }, 'Failed to join store');
        throw error;
      }
    }
  );

  // GET /api/stores/:storeId/members - Get store members
  fastify.get<{ Params: { storeId: string } }>(
    '/api/stores/:storeId/members',
    {
      schema: {
        description: 'Get store members',
        tags: ['stores'],
        params: {
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
                storeId: { type: 'string' },
                nickname: { type: 'string' },
                role: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { storeId } = request.params;
      app.logger.info({ storeId }, 'Fetching store members');

      try {
        const members = await app.db
          .select()
          .from(schema.storeMembers)
          .where(eq(schema.storeMembers.storeId, storeId));

        app.logger.info({ storeId, count: members.length }, 'Store members retrieved');
        return members;
      } catch (error) {
        app.logger.error({ err: error, storeId }, 'Failed to fetch store members');
        throw error;
      }
    }
  );

  // GET /api/stores/current - Get current store for device
  fastify.get<{
    Querystring: { deviceId: string };
  }>(
    '/api/stores/current',
    {
      schema: {
        description: 'Get current store for device',
        tags: ['stores'],
        querystring: {
          type: 'object',
          required: ['deviceId'],
          properties: {
            deviceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              storeCode: { type: 'string' },
              role: { type: 'string' },
              nickname: { type: 'string' },
              memberId: { type: 'string' },
              members: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    nickname: { type: 'string' },
                    role: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const { deviceId } = request.query;
      app.logger.info({ deviceId }, 'Fetching current store for device');

      try {
        // Get member record for device
        const member = await app.db
          .select()
          .from(schema.storeMembers)
          .where(eq(schema.storeMembers.deviceId, deviceId))
          .limit(1);

        if (member.length === 0) {
          app.logger.info({ deviceId }, 'Device not linked to any store');
          return reply.status(404).send({ error: 'Device not linked to any store' });
        }

        // Get store details
        const store = await app.db
          .select()
          .from(schema.stores)
          .where(eq(schema.stores.id, member[0].storeId))
          .limit(1);

        if (store.length === 0) {
          app.logger.warn({ deviceId }, 'Store not found for device member');
          return reply.status(404).send({ error: 'Store not found' });
        }

        // Get all members of the store
        const members = await app.db
          .select()
          .from(schema.storeMembers)
          .where(eq(schema.storeMembers.storeId, store[0].id));

        const result = {
          id: store[0].id,
          name: store[0].name,
          storeCode: store[0].storeCode,
          role: member[0].role,
          nickname: member[0].nickname,
          memberId: member[0].id,
          members: members.map((m) => ({
            id: m.id,
            nickname: m.nickname,
            role: m.role,
            createdAt: m.createdAt,
          })),
        };

        app.logger.info({ deviceId, storeId: store[0].id }, 'Current store retrieved successfully');
        return result;
      } catch (error) {
        app.logger.error({ err: error, deviceId }, 'Failed to fetch current store');
        throw error;
      }
    }
  );
}
