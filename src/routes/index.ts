import { Router,Request,Response } from 'express';
import { readFileRoute } from './read.route';
import { uploadFileRoute } from './upload.route';
import { handleDataRoute } from './handleData.route';
import path from 'path';

import express from 'express';
export const appRouter = Router();

appRouter.use('/read',readFileRoute)

appRouter.use('/uploadFile',uploadFileRoute)

appRouter.use('/data',handleDataRoute)

appRouter.use('/public', express.static(path.join(__dirname, '../public')));
