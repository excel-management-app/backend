import { Router } from 'express';
import { fileRoute } from './file.route';
import { wordRoute } from './word.route';
import { deviceRoute } from './device.route';

export const appRouter = Router();

appRouter.use('/files', fileRoute);

appRouter.use('/words', wordRoute);

appRouter.use('/device', deviceRoute);
