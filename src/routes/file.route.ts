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
} from '../services/excel.service';

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, 'src/uploads');
    },
    filename: function (_req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

export const fileRoute = express.Router();

fileRoute.post('/upload', upload.single('file'), uploadExcelFile);

fileRoute.put('/:fileId/sheets/:sheetName/rows/:rowIndex', updateRowInSheet);
fileRoute.post('/:fileId/sheets/:sheetName/rows', addRowToSheet);

fileRoute.delete(
    '/:fileId/sheets/:sheetName/rows/:rowIndex',
    deleteRowFromSheet,
);

fileRoute.get('/:fileId/export', exportFile);
fileRoute.get('/:fileId', getFileData);

fileRoute.get('/', getFiles);
