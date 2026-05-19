// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes      from './modules/auth/auth.routes';
import productRoutes   from './modules/products/products.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import receiptRoutes   from './modules/receipts/receipts.routes';
import issueRoutes     from './modules/issues/issues.routes';
import reportRoutes    from './modules/reports/reports.routes';
import issueRequestRoutes from './modules/issue-requests/issue-requests.routes';
import notificationRoutes from './modules/notifications/notifications.routes';

// Users routes — implement trong Phase 1.7
import usersRoutes from './modules/users/users.routes';

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.IS_PROD ? 'combined' : 'dev'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/receipts',  receiptRoutes);
app.use('/api/issues',    issueRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/issue-requests', issueRequestRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Error handler (PHẢI ĐỂ CUỐI CÙNG) ──────────────────────────────────────
app.use(errorHandler);

export default app;
