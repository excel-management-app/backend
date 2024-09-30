import { Router,Request,Response } from 'express';
import { readFileRoute } from './read.route';
import { uploadFileRoute } from './upload.route';
import path from 'path';

import express from 'express';
export const appRouter = Router();

appRouter.use('/read',readFileRoute)

appRouter.use('/uploadFile',uploadFileRoute)

appRouter.use('/public', express.static(path.join(__dirname, '../public')));
