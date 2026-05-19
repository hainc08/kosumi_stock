// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { loginHandler, refreshHandler, meHandler } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/login',   loginHandler);
router.post('/refresh', refreshHandler);
router.get('/me',       authenticate, meHandler);

export default router;
