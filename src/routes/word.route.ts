import express from 'express';
import {
    exportDataToword
} from '../services/word.service';
import path from 'path';

export const wordRoute = express.Router();

wordRoute.post('/:fileId/sheets/:sheetName/rows/:rowIndex', exportDataToword);
