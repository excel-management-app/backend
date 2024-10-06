import { Router } from 'express';
import { readFileRoute } from './read.route';
import { fileRoute } from './file.route';
import { wordRoute } from './word.route';

export const appRouter = Router();

appRouter.use('/read', readFileRoute);

appRouter.use('/files', fileRoute);

appRouter.use('/word', wordRoute);
