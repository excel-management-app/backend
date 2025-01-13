import express from 'express';
import { exportRowToWord } from 'services/files/exportRowToWord';
import { exportRowsToWord } from 'services/files/exportRowsToWord';
import { authenticateJWT } from '../middlewares/authenticateJWT';

export const wordRoute = express.Router();

wordRoute.post('/:fileId/sheets/:sheetName', authenticateJWT, exportRowsToWord);

wordRoute.get(
    '/:fileId/sheets/:sheetName/:tamY',
    authenticateJWT,
    exportRowToWord,
);
