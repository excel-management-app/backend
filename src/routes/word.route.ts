import express from 'express';
import { exportDataToword } from '../services/word.service';

export const wordRoute = express.Router();

wordRoute.post('/:fileId/sheets/:sheetName/rows', exportDataToword);

