import express from 'express';
import { exportManytoWord, exportOneToWord } from '../services/word.service';
import { authenticateJWT } from '../middlewares/authenticateJWT';

export const wordRoute = express.Router();

wordRoute.post('/:fileId/sheets/:sheetName',authenticateJWT, exportManytoWord);

wordRoute.get('/:fileId/sheets/:sheetName/:tamY',authenticateJWT, exportOneToWord);
