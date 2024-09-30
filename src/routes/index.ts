import { Router,Request,Response } from 'express';
import { readFileRoute } from './read.route';

export const appRouter = Router();

appRouter.use('/read',readFileRoute)

