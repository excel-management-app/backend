import express from 'express';
import multer from 'multer';
import {
    uploadExcelFile,
    addRowToSheet,
    updateRowInSheet,
    getFileData,
    getFiles,
    exportWord,
    exportManyWord,
    uploadWordFile,
    exportFileBySheet,
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

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

export const fileRoute = express.Router();

fileRoute.post(
    '/upload',
    checkAdminMiddleware,
    upload.single('file'),
    uploadExcelFile,
);

fileRoute.post(
    '/uploadTemplateWord',
    checkAdminMiddleware,
    upload.single('file'),
    uploadWordFile,
);

fileRoute.put('/:fileId/sheets/:sheetName/rows', updateRowInSheet);
fileRoute.post('/:fileId/sheets/:sheetName/rows', addRowToSheet);

fileRoute.get('/downloadWord/:tamY', exportWord);
fileRoute.get('/:fileId/downloadManyWord', exportManyWord);
fileRoute.get('/:fileId/sheets/:sheetName/export', exportFileBySheet);
fileRoute.get('/:fileId/downloadWord', exportWord);
fileRoute.get('/:fileId', getFileData);

fileRoute.get('/', getFiles);
