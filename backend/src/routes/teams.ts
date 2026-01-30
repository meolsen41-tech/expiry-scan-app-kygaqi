import type { FastifyInstance } from 'fastify';
import { eq, and, inArray } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/teams - Create new team
  fastify.post<{
    Body: {
      deviceId: string;
      teamName: string;
      deviceName: string;
    };
  }>(
    '/api/teams',
    {
      schema: {
        description: 'Create team',
        tags: ['teams'],
        body: {
          type: 'object',
          required: ['deviceId', 'teamName', 'deviceName'],
          properties: {
            deviceId: { type: 'string' },
            teamName: { type: 'string' },
            deviceName: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              inviteCode: { type: 'string' },
              createdBy: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { deviceId, teamName, deviceName } = request.body;
      app.logger.info({ deviceId, teamName }, 'Creating team');

      try {
        const inviteCode = generateInviteCode();

        const team = await app.db
          .insert(schema.teams)
          .values({
            name: teamName,
            inviteCode,
            createdBy: deviceId,
          })
          .returning();

        const teamId = team[0].id;

        // Add creator as owner
        await app.db
          .insert(schema.teamMembers)
          .values({
            teamId,
            deviceId,
            deviceName,
            role: 'owner',
          });

        app.logger.info({ teamId, inviteCode }, 'Team created successfully');
        return team[0];
      } catch (error) {
        app.logger.error({ err: error, deviceId, teamName }, 'Failed to create team');
        throw error;
      }
    }
  );

  // POST /api/teams/join - Join team with invite code
  fastify.post<{
    Body: {
      inviteCode: string;
      deviceId: string;
      deviceName: string;
    };
  }>(
    '/api/teams/join',
    {
      schema: {
        description: 'Join team with invite code',
        tags: ['teams'],
        body: {
          type: 'object',
          required: ['inviteCode', 'deviceId', 'deviceName'],
          properties: {
            inviteCode: { type: 'string' },
            deviceId: { type: 'string' },
            deviceName: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              team: { type: 'object' },
              member: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { inviteCode, deviceId, deviceName } = request.body;
      app.logger.info({ inviteCode, deviceId }, 'Joining team');

      try {
        // Find team with invite code
        const team = await app.db
          .select()
          .from(schema.teams)
          .where(eq(schema.teams.inviteCode, inviteCode.toUpperCase()))
          .limit(1);

        if (team.length === 0) {
          app.logger.warn({ inviteCode }, 'Invalid invite code');
          return reply.status(404).send({ error: 'Invalid invite code' });
        }

        const teamId = team[0].id;

        // Check if already a member
        const existingMember = await app.db
          .select()
          .from(schema.teamMembers)
          .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.deviceId, deviceId)))
          .limit(1);

        if (existingMember.length > 0) {
          app.logger.warn({ teamId, deviceId }, 'Device is already a team member');
          return reply.status(400).send({ error: 'Already a member of this team' });
        }

        // Add device as member
        const member = await app.db
          .insert(schema.teamMembers)
          .values({
            teamId,
            deviceId,
            deviceName,
            role: 'member',
          })
          .returning();

        app.logger.info({ teamId, deviceId }, 'Device joined team successfully');
        return { success: true, team: team[0], member: member[0] };
      } catch (error) {
        app.logger.error({ err: error, inviteCode, deviceId }, 'Failed to join team');
        throw error;
      }
    }
  );

  // GET /api/teams/:deviceId - Get teams for device
  fastify.get<{ Params: { deviceId: string } }>(
    '/api/teams/:deviceId',
    {
      schema: {
        description: 'Get teams for device',
        tags: ['teams'],
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
                name: { type: 'string' },
                inviteCode: { type: 'string' },
                role: { type: 'string' },
                memberCount: { type: 'integer' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { deviceId } = request.params;
      app.logger.info({ deviceId }, 'Fetching teams for device');

      try {
        // Get all teams for device
        const members = await app.db
          .select()
          .from(schema.teamMembers)
          .where(eq(schema.teamMembers.deviceId, deviceId));

        const teamIds = members.map((m) => m.teamId);

        if (teamIds.length === 0) {
          app.logger.info({ deviceId }, 'No teams found for device');
          return [];
        }

        const teams = await app.db.select().from(schema.teams).where(inArray(schema.teams.id, teamIds));

        // Fetch member counts for each team
        const result = await Promise.all(
          teams.map(async (team) => {
            const memberCount = await app.db
              .select()
              .from(schema.teamMembers)
              .where(eq(schema.teamMembers.teamId, team.id));

            const member = members.find((m) => m.teamId === team.id);

            return {
              id: team.id,
              name: team.name,
              inviteCode: team.inviteCode,
              role: member!.role,
              memberCount: memberCount.length,
              createdAt: team.createdAt,
            };
          })
        );

        app.logger.info({ deviceId, count: result.length }, 'Teams retrieved successfully');
        return result;
      } catch (error) {
        app.logger.error({ err: error, deviceId }, 'Failed to fetch teams');
        throw error;
      }
    }
  );

  // GET /api/teams/:teamId/members - Get team members
  fastify.get<{ Params: { teamId: string } }>(
    '/api/teams/:teamId/members',
    {
      schema: {
        description: 'Get team members',
        tags: ['teams'],
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                deviceName: { type: 'string' },
                role: { type: 'string' },
                joinedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { teamId } = request.params;
      app.logger.info({ teamId }, 'Fetching team members');

      try {
        // Verify team exists
        const team = await app.db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).limit(1);

        if (team.length === 0) {
          app.logger.warn({ teamId }, 'Team not found');
          return reply.status(404).send({ error: 'Team not found' });
        }

        const members = await app.db
          .select()
          .from(schema.teamMembers)
          .where(eq(schema.teamMembers.teamId, teamId));

        app.logger.info({ teamId, count: members.length }, 'Team members retrieved');
        return members;
      } catch (error) {
        app.logger.error({ err: error, teamId }, 'Failed to fetch team members');
        throw error;
      }
    }
  );

  // GET /api/teams/:teamId/entries - Get entries from all team members
  fastify.get<{ Params: { teamId: string } }>(
    '/api/teams/:teamId/entries',
    {
      schema: {
        description: 'Get entries from all team members',
        tags: ['teams'],
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string' },
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
                status: { type: 'string' },
                scannedBy: { type: 'string' },
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
      const { teamId } = request.params;
      app.logger.info({ teamId }, 'Fetching team entries');

      try {
        // Verify team exists
        const team = await app.db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).limit(1);

        if (team.length === 0) {
          app.logger.warn({ teamId }, 'Team not found');
          return reply.status(404).send({ error: 'Team not found' });
        }

        // Get all team members
        const members = await app.db
          .select()
          .from(schema.teamMembers)
          .where(eq(schema.teamMembers.teamId, teamId));

        const memberDeviceIds = members.map((m) => m.deviceId);

        if (memberDeviceIds.length === 0) {
          app.logger.info({ teamId }, 'No team members found');
          return [];
        }

        // Get entries from all members
        const entries = await app.db
          .select()
          .from(schema.productEntries)
          .where(inArray(schema.productEntries.scannedByDeviceId, memberDeviceIds));

        // Enhance entries with scanned by info
        const result = entries.map((entry) => {
          const scannedByMember = members.find((m) => m.deviceId === entry.scannedByDeviceId);
          return {
            id: entry.id,
            barcode: entry.barcode,
            productName: entry.productName,
            expirationDate: entry.expirationDate,
            status: entry.status,
            scannedBy: scannedByMember?.deviceName || 'Unknown',
            quantity: entry.quantity,
            location: entry.location,
            notes: entry.notes,
            imageUrl: entry.imageUrl,
            createdAt: entry.createdAt,
          };
        });

        app.logger.info({ teamId, count: result.length }, 'Team entries retrieved');
        return result;
      } catch (error) {
        app.logger.error({ err: error, teamId }, 'Failed to fetch team entries');
        throw error;
      }
    }
  );

  // DELETE /api/teams/:teamId/leave - Leave team
  fastify.delete<{
    Params: { teamId: string };
    Body: { deviceId: string };
  }>(
    '/api/teams/:teamId/leave',
    {
      schema: {
        description: 'Leave team',
        tags: ['teams'],
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string' },
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
      const { teamId } = request.params;
      const { deviceId } = request.body;
      app.logger.info({ teamId, deviceId }, 'Leaving team');

      try {
        // Verify team exists
        const team = await app.db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).limit(1);

        if (team.length === 0) {
          app.logger.warn({ teamId }, 'Team not found');
          return reply.status(404).send({ error: 'Team not found' });
        }

        // Check if owner and there are other members
        const member = await app.db
          .select()
          .from(schema.teamMembers)
          .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.deviceId, deviceId)))
          .limit(1);

        if (member.length === 0) {
          app.logger.warn({ teamId, deviceId }, 'Member not found in team');
          return reply.status(404).send({ error: 'Not a member of this team' });
        }

        if (member[0].role === 'owner') {
          const allMembers = await app.db
            .select()
            .from(schema.teamMembers)
            .where(eq(schema.teamMembers.teamId, teamId));

          if (allMembers.length > 1) {
            app.logger.warn({ teamId, deviceId }, 'Cannot leave as owner with other members');
            return reply
              .status(400)
              .send({ error: 'Owner cannot leave team with other members. Delete the team instead.' });
          }
        }

        // Remove member from team
        await app.db
          .delete(schema.teamMembers)
          .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.deviceId, deviceId)));

        app.logger.info({ teamId, deviceId }, 'Device left team successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, teamId, deviceId }, 'Failed to leave team');
        throw error;
      }
    }
  );

  // DELETE /api/teams/:teamId - Delete team (owner only)
  fastify.delete<{
    Params: { teamId: string };
    Body: { deviceId: string };
  }>(
    '/api/teams/:teamId',
    {
      schema: {
        description: 'Delete team (owner only)',
        tags: ['teams'],
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string' },
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
      const { teamId } = request.params;
      const { deviceId } = request.body;
      app.logger.info({ teamId, deviceId }, 'Deleting team');

      try {
        // Verify team exists
        const team = await app.db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).limit(1);

        if (team.length === 0) {
          app.logger.warn({ teamId }, 'Team not found');
          return reply.status(404).send({ error: 'Team not found' });
        }

        // Check if requester is owner
        if (team[0].createdBy !== deviceId) {
          app.logger.warn({ teamId, deviceId }, 'Only owner can delete team');
          return reply.status(403).send({ error: 'Only team owner can delete team' });
        }

        // Delete team (members will cascade delete)
        await app.db.delete(schema.teams).where(eq(schema.teams.id, teamId));

        app.logger.info({ teamId }, 'Team deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, teamId }, 'Failed to delete team');
        throw error;
      }
    }
  );
}
