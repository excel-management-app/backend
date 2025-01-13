import express from 'express';
import multer from 'multer';
import {
    exportFileBySheet,
    exportManyWord,
    exportWord,
    getFileData,
    searchDataByNameAndDate,
    getFileDataBySheetNameAndTamY,
    getFiles,
    updateOrAddRowInSheet,
    uploadExcelFile,
    deleteFile,
    getDeletedFiles,
    restoreFile,
    permanentlyDeleteFile,
    bulkInsertRows,
} from 'services/files';
import { checkAdminMiddleware } from '../middlewares/isAdmin';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import { uploadWordTemplate } from 'services/files/uploadWordTemplate';
import { TEMPLATES_PATH } from 'storages/consts';

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, TEMPLATES_PATH);
    },
    filename: function (_req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); //set to 50 MB

export const fileRoute = express.Router();

fileRoute.post(
    '/upload',
    authenticateJWT,
    checkAdminMiddleware,
    upload.single('file'),
    uploadExcelFile,
);

fileRoute.post(
    '/uploadTemplateWord',
    authenticateJWT,
    checkAdminMiddleware,
    upload.single('file'),
    uploadWordTemplate,
);

fileRoute.get(
    '/:fileId/sheets/:sheetName/rows/:tamY',
    getFileDataBySheetNameAndTamY,
);

fileRoute.get('/:fileId/sheets/:sheetName/rows', searchDataByNameAndDate);

fileRoute.post(
    '/:fileId/sheets/:sheetName/rows',
    authenticateJWT,
    updateOrAddRowInSheet,
);
// bulk insert
fileRoute.post('/:fileId/sheets/:sheetName/rows/bulk', bulkInsertRows);

// word
fileRoute.get('/downloadWord/:tamY', exportWord);
fileRoute.get('/:fileId/downloadManyWord', exportManyWord);
fileRoute.get('/:fileId/sheets/:sheetName/export', exportFileBySheet);
fileRoute.get('/:fileId/sheets/:sheetName', getFileData);
fileRoute.get('/:fileId/downloadWord', exportWord);

fileRoute.put(
    '/:fileId/delete',
    authenticateJWT,
    checkAdminMiddleware,
    deleteFile,
);
// permanentlyDeleteFile
fileRoute.delete(
    '/:fileId/delete',
    authenticateJWT,
    checkAdminMiddleware,
    permanentlyDeleteFile,
);
// restoreFile
fileRoute.put(
    '/:fileId/restore',
    authenticateJWT,
    checkAdminMiddleware,
    restoreFile,
);

fileRoute.get(
    '/deleted',
    authenticateJWT,
    checkAdminMiddleware,
    getDeletedFiles,
);
fileRoute.get('/', getFiles);
