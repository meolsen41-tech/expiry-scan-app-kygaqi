import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema.js';
import * as productsRoutes from './routes/products.js';
import * as uploadRoutes from './routes/upload.js';
import * as notificationsRoutes from './routes/notifications.js';
import * as batchScansRoutes from './routes/batch-scans.js';
import * as teamsRoutes from './routes/teams.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Enable storage for file uploads
app.withStorage();

// Export App type for use in route files
export type App = typeof app;

// Register routes
productsRoutes.register(app, app.fastify);
uploadRoutes.register(app, app.fastify);
notificationsRoutes.register(app, app.fastify);
batchScansRoutes.register(app, app.fastify);
teamsRoutes.register(app, app.fastify);

await app.run();
app.logger.info('Application running');
