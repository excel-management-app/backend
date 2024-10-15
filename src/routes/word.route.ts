import express from 'express';
import { exportManytoWord, exportOneToWord } from '../services/word.service';

export const wordRoute = express.Router();

wordRoute.post('/:fileId/sheets/:sheetName/rows', exportManytoWord);

wordRoute.get('/:fileId/sheets/:sheetName/rows/:rowIndex', exportOneToWord);
