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
    uploadWordFile,
    countRowsByDeviceId,
} from '../services/excel.service';

function normalizeString(str: string) {
    // Thay thế các ký tự UTF-8 có dấu thành không dấu
    const normalizedStr = str
      .normalize("NFD") // Tách các ký tự có dấu
      .replace(/[\u0300-\u036f]/g, ""); // Loại bỏ các dấu
  
    // Loại bỏ khoảng trắng
    return normalizedStr.replace(/\s+/g, "");
  }

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

fileRoute.post('/uploadTemplateWord', upload.single('file'), uploadWordFile);

fileRoute.put('/:fileId/sheets/:sheetName/rows/:rowIndex', updateRowInSheet);
fileRoute.post('/:fileId/sheets/:sheetName/rows', addRowToSheet);

fileRoute.delete(
    '/:fileId/sheets/:sheetName/rows/:rowIndex',
    deleteRowFromSheet,
);

fileRoute.get('/:fileId/export', exportFile);
fileRoute.get('/:fileId/downloadWord', exportWord);
fileRoute.get('/:fileId', getFileData);

//count rows by device
fileRoute.get('/:fileId/sheets/:sheetName/count', countRowsByDeviceId);

fileRoute.get('/', getFiles);
