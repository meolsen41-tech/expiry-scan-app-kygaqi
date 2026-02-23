import type { FastifyInstance } from 'fastify';
import { eq, and, isNull } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

function generateJoinCode(): string {
  // Characters to use: uppercase letters and numbers, excluding O, 0, I, 1, L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';

  // Generate 3 chars + 4 chars format (8 total)
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
      nickname: string;
      deviceId: string;
    };
  }>(
    '/api/stores',
    {
      schema: {
        description: 'Create a new store',
        tags: ['stores'],
        body: {
          type: 'object',
          required: ['name', 'nickname', 'deviceId'],
          properties: {
            name: { type: 'string' },
            nickname: { type: 'string' },
            deviceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              joinCode: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, nickname, deviceId } = request.body;
      app.logger.info({ name, deviceId }, 'Creating store');

      try {
        let joinCode = generateJoinCode();
        let codeExists = true;
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure unique join code
        while (codeExists && attempts < maxAttempts) {
          const existing = await app.db
            .select()
            .from(schema.stores)
            .where(eq(schema.stores.joinCode, joinCode))
            .limit(1);

          if (existing.length === 0) {
            codeExists = false;
          } else {
            joinCode = generateJoinCode();
            attempts++;
          }
        }

        if (codeExists) {
          app.logger.error({ name }, 'Failed to generate unique join code');
          return reply.status(500).send({ error: 'Failed to generate join code' });
        }

        const store = await app.db
          .insert(schema.stores)
          .values({
            name,
            joinCode,
          })
          .returning();

        const storeId = store[0].id;

        // Add creator as owner
        await app.db
          .insert(schema.members)
          .values({
            storeId,
            nickname,
            deviceId,
            role: 'owner',
          });

        app.logger.info({ storeId, joinCode }, 'Store created successfully');
        return store[0];
      } catch (error) {
        app.logger.error({ err: error, name, deviceId }, 'Failed to create store');
        throw error;
      }
    }
  );

  // POST /api/stores/join - Join store with join code
  fastify.post<{
    Body: {
      joinCode: string;
      nickname: string;
      deviceId: string;
    };
  }>(
    '/api/stores/join',
    {
      schema: {
        description: 'Join store with join code',
        tags: ['stores'],
        body: {
          type: 'object',
          required: ['joinCode', 'nickname', 'deviceId'],
          properties: {
            joinCode: { type: 'string' },
            nickname: { type: 'string' },
            deviceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              store: { type: 'object' },
              member: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { joinCode, nickname, deviceId } = request.body;
      app.logger.info({ joinCode, deviceId }, 'Joining store');

      try {
        // Find store with join code (case-insensitive)
        const store = await app.db
          .select()
          .from(schema.stores)
          .where(eq(schema.stores.joinCode, joinCode.toUpperCase()))
          .limit(1);

        if (store.length === 0) {
          app.logger.warn({ joinCode }, 'Invalid join code');
          return reply.status(404).send({ error: 'Invalid join code' });
        }

        const storeId = store[0].id;

        // Check if device is already a member
        const existingMember = await app.db
          .select()
          .from(schema.members)
          .where(and(eq(schema.members.storeId, storeId), eq(schema.members.deviceId, deviceId)))
          .limit(1);

        if (existingMember.length > 0) {
          app.logger.warn({ storeId, deviceId }, 'Device is already a store member');
          return reply.status(400).send({ error: 'Already a member of this store' });
        }

        // Add device as member
        const member = await app.db
          .insert(schema.members)
          .values({
            storeId,
            nickname,
            deviceId,
            role: 'member',
          })
          .returning();

        app.logger.info({ storeId, deviceId }, 'Device joined store successfully');
        return { success: true, store: store[0], member: member[0] };
      } catch (error) {
        app.logger.error({ err: error, joinCode, deviceId }, 'Failed to join store');
        throw error;
      }
    }
  );

  // GET /api/stores/:deviceId - Get store for device
  fastify.get<{ Params: { deviceId: string } }>(
    '/api/stores/:deviceId',
    {
      schema: {
        description: 'Get store for device',
        tags: ['stores'],
        params: {
          type: 'object',
          properties: {
            deviceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: ['object', 'null'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              joinCode: { type: 'string' },
              role: { type: 'string' },
              nickname: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { deviceId } = request.params;
      app.logger.info({ deviceId }, 'Fetching store for device');

      try {
        // Get member record for device
        const member = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.deviceId, deviceId))
          .limit(1);

        if (member.length === 0) {
          app.logger.info({ deviceId }, 'Device not linked to any store');
          return null;
        }

        // Get store details
        const store = await app.db
          .select()
          .from(schema.stores)
          .where(eq(schema.stores.id, member[0].storeId))
          .limit(1);

        if (store.length === 0) {
          app.logger.warn({ deviceId }, 'Store not found for device member');
          return null;
        }

        const result = {
          id: store[0].id,
          name: store[0].name,
          joinCode: store[0].joinCode,
          role: member[0].role,
          nickname: member[0].nickname,
        };

        app.logger.info({ deviceId, storeId: store[0].id }, 'Store retrieved successfully');
        return result;
      } catch (error) {
        app.logger.error({ err: error, deviceId }, 'Failed to fetch store');
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
                nickname: { type: 'string' },
                role: { type: 'string' },
                joinedAt: { type: 'string' },
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
        // Verify store exists
        const store = await app.db.select().from(schema.stores).where(eq(schema.stores.id, storeId)).limit(1);

        if (store.length === 0) {
          app.logger.warn({ storeId }, 'Store not found');
          return reply.status(404).send({ error: 'Store not found' });
        }

        const members = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.storeId, storeId));

        app.logger.info({ storeId, count: members.length }, 'Store members retrieved');
        return members;
      } catch (error) {
        app.logger.error({ err: error, storeId }, 'Failed to fetch store members');
        throw error;
      }
    }
  );

  // POST /api/stores/:storeId/leave - Leave store
  fastify.post<{
    Params: { storeId: string };
    Body: { deviceId: string };
  }>(
    '/api/stores/:storeId/leave',
    {
      schema: {
        description: 'Leave store',
        tags: ['stores'],
        params: {
          type: 'object',
          properties: {
            storeId: { type: 'string' },
          },
        },
        body: {
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
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { storeId } = request.params;
      const { deviceId } = request.body;
      app.logger.info({ storeId, deviceId }, 'Leaving store');

      try {
        // Verify store exists
        const store = await app.db.select().from(schema.stores).where(eq(schema.stores.id, storeId)).limit(1);

        if (store.length === 0) {
          app.logger.warn({ storeId }, 'Store not found');
          return reply.status(404).send({ error: 'Store not found' });
        }

        // Check if member exists
        const member = await app.db
          .select()
          .from(schema.members)
          .where(and(eq(schema.members.storeId, storeId), eq(schema.members.deviceId, deviceId)))
          .limit(1);

        if (member.length === 0) {
          app.logger.warn({ storeId, deviceId }, 'Member not found in store');
          return reply.status(404).send({ error: 'Not a member of this store' });
        }

        // Check if owner and there are other members
        if (member[0].role === 'owner') {
          const allMembers = await app.db
            .select()
            .from(schema.members)
            .where(eq(schema.members.storeId, storeId));

          if (allMembers.length > 1) {
            app.logger.warn({ storeId, deviceId }, 'Cannot leave as owner with other members');
            return reply
              .status(400)
              .send({ error: 'Owner cannot leave store with other members. Delete the store instead.' });
          }
        }

        // Remove member from store
        await app.db
          .delete(schema.members)
          .where(and(eq(schema.members.storeId, storeId), eq(schema.members.deviceId, deviceId)));

        app.logger.info({ storeId, deviceId }, 'Device left store successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, storeId, deviceId }, 'Failed to leave store');
        throw error;
      }
    }
  );

  // DELETE /api/stores/:storeId - Delete store (owner only)
  fastify.delete<{
    Params: { storeId: string };
    Body: { deviceId: string };
  }>(
    '/api/stores/:storeId',
    {
      schema: {
        description: 'Delete store (owner only)',
        tags: ['stores'],
        params: {
          type: 'object',
          properties: {
            storeId: { type: 'string' },
          },
        },
        body: {
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
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { storeId } = request.params;
      const { deviceId } = request.body;
      app.logger.info({ storeId, deviceId }, 'Deleting store');

      try {
        // Verify store exists
        const store = await app.db.select().from(schema.stores).where(eq(schema.stores.id, storeId)).limit(1);

        if (store.length === 0) {
          app.logger.warn({ storeId }, 'Store not found');
          return reply.status(404).send({ error: 'Store not found' });
        }

        // Check if requester is owner
        const member = await app.db
          .select()
          .from(schema.members)
          .where(and(eq(schema.members.storeId, storeId), eq(schema.members.deviceId, deviceId)))
          .limit(1);

        if (member.length === 0 || member[0].role !== 'owner') {
          app.logger.warn({ storeId, deviceId }, 'Only owner can delete store');
          return reply.status(403).send({ error: 'Only store owner can delete store' });
        }

        // Delete store (members will cascade delete)
        await app.db.delete(schema.stores).where(eq(schema.stores.id, storeId));

        app.logger.info({ storeId }, 'Store deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, storeId }, 'Failed to delete store');
        throw error;
      }
    }
  );
}
