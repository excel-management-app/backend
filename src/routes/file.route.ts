import express from 'express';
import multer from 'multer';
import {
    exportFileBySheet,
    exportManyWord,
    exportMap,
    exportWord,
    getFileData,
    searchDataByNameAndDate,
    getFileDataBySheetNameAndTamY,
    getFiles,
    updateOrAddRowInSheet,
    uploadExcelFile,
    uploadMapFile,
    uploadWordFile,
    deleteFile,
} from '../services/file.service';
import { checkAdminMiddleware } from '../middlewares/isAdmin';

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, 'src/files/templates');
    },
    filename: function (_req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); //set to 50 MB

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

fileRoute.post(
    '/uploadTemplateMapFile',
    checkAdminMiddleware,
    upload.single('file'),
    uploadMapFile,
);

fileRoute.get(
    '/:fileId/sheets/:sheetName/rows/:tamY',
    getFileDataBySheetNameAndTamY,
);

fileRoute.get('/:fileId/sheets/:sheetName/rows', searchDataByNameAndDate);

fileRoute.post('/:fileId/sheets/:sheetName/rows', updateOrAddRowInSheet);

fileRoute.get('/downloadWord/:tamY', exportWord);
fileRoute.get('/downloadMap', exportMap);
fileRoute.get('/:fileId/downloadManyWord', exportManyWord);
fileRoute.get('/:fileId/sheets/:sheetName/export', exportFileBySheet);
fileRoute.get('/:fileId/sheets/:sheetName', getFileData);
fileRoute.get('/:fileId/downloadWord', exportWord);
fileRoute.delete('/:fileId/delete', deleteFile);

fileRoute.get('/', getFiles);
