import express from 'express';
import { exportDataToword } from '../services/word.service';

export const wordRoute = express.Router();

wordRoute.get('/:fileId/sheets/:sheetName/rows', exportDataToword);
