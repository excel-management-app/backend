import { Router } from 'express';
import { fileRoute } from './file.route';

export const appRouter = Router();

appRouter.use('/files', fileRoute);
