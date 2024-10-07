import { Router } from 'express';
import { fileRoute } from './file.route';
import { wordRoute } from './word.route';

export const appRouter = Router();

appRouter.use('/files', fileRoute);

appRouter.use('/word', wordRoute);
