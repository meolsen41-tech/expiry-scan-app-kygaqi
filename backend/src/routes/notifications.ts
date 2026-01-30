import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

async function sendExpoNotification(expoPushToken: string, title: string, body: string, data?: Record<string, string>) {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default' as const,
      title,
      body,
      data: data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

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
  // POST /api/notifications/register-token - Register push token
  fastify.post<{
    Body: {
      deviceId: string;
      expoPushToken: string;
      platform: 'ios' | 'android';
    };
  }>(
    '/api/notifications/register-token',
    {
      schema: {
        description: 'Register push notification token',
        tags: ['notifications'],
        body: {
          type: 'object',
          required: ['deviceId', 'expoPushToken', 'platform'],
          properties: {
            deviceId: { type: 'string' },
            expoPushToken: { type: 'string' },
            platform: { type: 'string', enum: ['ios', 'android'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              tokenId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { deviceId, expoPushToken, platform } = request.body;
      app.logger.info({ deviceId, platform }, 'Registering push token');

      try {
        // Check if token already exists
        const existing = await app.db
          .select()
          .from(schema.pushTokens)
          .where(eq(schema.pushTokens.deviceId, deviceId))
          .limit(1);

        let tokenId: string;
        if (existing.length > 0) {
          // Update existing token
          const updated = await app.db
            .update(schema.pushTokens)
            .set({
              expoPushToken,
              platform,
              updatedAt: new Date(),
            })
            .where(eq(schema.pushTokens.deviceId, deviceId))
            .returning();
          tokenId = updated[0].id;
          app.logger.info({ deviceId, tokenId }, 'Push token updated');
        } else {
          // Create new token
          const created = await app.db
            .insert(schema.pushTokens)
            .values({
              userId: deviceId, // Use deviceId as userId for now
              deviceId,
              expoPushToken,
              platform,
            })
            .returning();
          tokenId = created[0].id;
          app.logger.info({ deviceId, tokenId }, 'Push token registered');
        }

        return { success: true, tokenId };
      } catch (error) {
        app.logger.error({ err: error, deviceId }, 'Failed to register push token');
        throw error;
      }
    }
  );

  // POST /api/notifications/schedule - Create notification schedule
  fastify.post<{
    Body: {
      deviceId: string;
      scheduleType: 'weekly' | 'daily';
      dayOfWeek?: number;
      timeOfDay: string;
    };
  }>(
    '/api/notifications/schedule',
    {
      schema: {
        description: 'Create notification schedule',
        tags: ['notifications'],
        body: {
          type: 'object',
          required: ['deviceId', 'scheduleType', 'timeOfDay'],
          properties: {
            deviceId: { type: 'string' },
            scheduleType: { type: 'string', enum: ['weekly', 'daily'] },
            dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
            timeOfDay: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              scheduleId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { deviceId, scheduleType, dayOfWeek, timeOfDay } = request.body;
      app.logger.info({ deviceId, scheduleType, timeOfDay }, 'Creating notification schedule');

      try {
        const schedule = await app.db
          .insert(schema.notificationSchedules)
          .values({
            deviceId,
            scheduleType,
            dayOfWeek: scheduleType === 'weekly' ? dayOfWeek : null,
            timeOfDay,
            enabled: true,
          })
          .returning();

        app.logger.info({ scheduleId: schedule[0].id }, 'Notification schedule created');
        return { success: true, scheduleId: schedule[0].id };
      } catch (error) {
        app.logger.error({ err: error, deviceId }, 'Failed to create notification schedule');
        throw error;
      }
    }
  );

  // GET /api/notifications/schedules/:deviceId - Get schedules for device
  fastify.get<{ Params: { deviceId: string } }>(
    '/api/notifications/schedules/:deviceId',
    {
      schema: {
        description: 'Get notification schedules for device',
        tags: ['notifications'],
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
                scheduleType: { type: 'string' },
                dayOfWeek: { type: 'integer' },
                timeOfDay: { type: 'string' },
                enabled: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { deviceId } = request.params;
      app.logger.info({ deviceId }, 'Fetching notification schedules');

      try {
        const schedules = await app.db
          .select()
          .from(schema.notificationSchedules)
          .where(eq(schema.notificationSchedules.deviceId, deviceId));

        app.logger.info({ deviceId, count: schedules.length }, 'Notification schedules retrieved');
        return schedules;
      } catch (error) {
        app.logger.error({ err: error, deviceId }, 'Failed to fetch notification schedules');
        throw error;
      }
    }
  );

  // PUT /api/notifications/schedule/:id - Update schedule
  fastify.put<{
    Params: { id: string };
    Body: {
      enabled?: boolean;
      timeOfDay?: string;
      dayOfWeek?: number;
    };
  }>(
    '/api/notifications/schedule/:id',
    {
      schema: {
        description: 'Update notification schedule',
        tags: ['notifications'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            timeOfDay: { type: 'string' },
            dayOfWeek: { type: 'integer' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              schedule: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { enabled, timeOfDay, dayOfWeek } = request.body;
      app.logger.info({ scheduleId: id }, 'Updating notification schedule');

      try {
        const current = await app.db
          .select()
          .from(schema.notificationSchedules)
          .where(eq(schema.notificationSchedules.id, id))
          .limit(1);

        if (current.length === 0) {
          app.logger.warn({ scheduleId: id }, 'Schedule not found');
          return reply.status(404).send({ error: 'Schedule not found' });
        }

        const updated = await app.db
          .update(schema.notificationSchedules)
          .set({
            enabled: enabled !== undefined ? enabled : current[0].enabled,
            timeOfDay: timeOfDay || current[0].timeOfDay,
            dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : current[0].dayOfWeek,
            updatedAt: new Date(),
          })
          .where(eq(schema.notificationSchedules.id, id))
          .returning();

        app.logger.info({ scheduleId: id }, 'Notification schedule updated');
        return { success: true, schedule: updated[0] };
      } catch (error) {
        app.logger.error({ err: error, scheduleId: id }, 'Failed to update notification schedule');
        throw error;
      }
    }
  );

  // DELETE /api/notifications/schedule/:id - Delete schedule
  fastify.delete<{ Params: { id: string } }>(
    '/api/notifications/schedule/:id',
    {
      schema: {
        description: 'Delete notification schedule',
        tags: ['notifications'],
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
      app.logger.info({ scheduleId: id }, 'Deleting notification schedule');

      try {
        const result = await app.db
          .delete(schema.notificationSchedules)
          .where(eq(schema.notificationSchedules.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ scheduleId: id }, 'Schedule not found for deletion');
          return reply.status(404).send({ error: 'Schedule not found' });
        }

        app.logger.info({ scheduleId: id }, 'Notification schedule deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, scheduleId: id }, 'Failed to delete notification schedule');
        throw error;
      }
    }
  );

  // POST /api/notifications/send-expiration-reminders - Send reminders for expiring products
  fastify.post<{ Body: { deviceId: string } }>(
    '/api/notifications/send-expiration-reminders',
    {
      schema: {
        description: 'Send expiration reminders',
        tags: ['notifications'],
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
              notificationsSent: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { deviceId } = request.body;
      app.logger.info({ deviceId }, 'Sending expiration reminders');

      try {
        // Get push token for device
        const pushToken = await app.db
          .select()
          .from(schema.pushTokens)
          .where(eq(schema.pushTokens.deviceId, deviceId))
          .limit(1);

        if (pushToken.length === 0) {
          app.logger.warn({ deviceId }, 'No push token registered for device');
          return reply.status(404).send({ error: 'No push token registered' });
        }

        // Get products expiring soon for this device
        const expiringProducts = await app.db
          .select()
          .from(schema.productEntries)
          .where(
            and(
              eq(schema.productEntries.status, 'expiring_soon'),
              eq(schema.productEntries.scannedByDeviceId, deviceId)
            )
          );

        let notificationsSent = 0;

        for (const product of expiringProducts) {
          const sent = await sendExpoNotification(
            pushToken[0].expoPushToken,
            'Product Expiring Soon',
            `${product.productName} expires on ${product.expirationDate}`,
            {
              productId: product.id,
              expirationDate: product.expirationDate,
            }
          );
          if (sent) {
            notificationsSent++;
          }
        }

        app.logger.info({ deviceId, notificationsSent }, 'Expiration reminders sent');
        return { success: true, notificationsSent };
      } catch (error) {
        app.logger.error({ err: error, deviceId }, 'Failed to send expiration reminders');
        throw error;
      }
    }
  );
}
