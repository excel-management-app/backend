import express from 'express';
import multer from 'multer';
import {
    uploadExcelFile,
    addRowToSheet,
    deleteRowFromSheet,
    updateRowInSheet,
    getFileData,
    getFiles,
    exportFile,
    exportWord,
    exportManyWord,
    uploadWordFile,
} from '../services/excel.service';
import { checkAdminMiddleware } from '../middlewares/isAdmin';

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, 'src/files/templates');
    },
    filename: function (_req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

export const fileRoute = express.Router();

fileRoute.post('/upload', upload.single('file'), uploadExcelFile);

fileRoute.post(
    '/uploadTemplateWord',
    checkAdminMiddleware,
    upload.single('file'),
    uploadWordFile,
);

fileRoute.put('/:fileId/sheets/:sheetName/rows/:rowIndex', updateRowInSheet);
fileRoute.post('/:fileId/sheets/:sheetName/rows', addRowToSheet);

fileRoute.delete(
    '/:fileId/sheets/:sheetName/rows/:rowIndex',
    deleteRowFromSheet,
);

fileRoute.get('/:fileId/export', exportFile);
fileRoute.get('/:rowIndex/downloadWord', exportWord);
fileRoute.get('/:fileId/downloadManyWord', exportManyWord);
fileRoute.get('/:fileId', getFileData);

fileRoute.get('/', getFiles);
