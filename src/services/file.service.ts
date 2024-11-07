/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Request, Response } from 'express';
import fs from 'fs';
import { LocalStorage } from 'node-localstorage';
import xlsx from 'xlsx';
import ExcelFile from '../models/excelFile';
import OriginFile from '../models/originFile';
import { getS3File } from '../s3/getS3File';
import { uploadS3File } from '../s3/uploadS3File';
import {
    exportExcelDataFromDB,
    OUTPUT_FILE_PATH,
} from './functions/exportExcelDataFromDB';
import { getAccountIdFromHeader } from './functions/getAccountIdFromHeader';
import { getFileDataByFileId } from './functions/getFileDataByFileId';
import { getFileName } from './functions/insertExcelDataToDB';

global.localStorage = new LocalStorage('./scratch');

export const uploadExcelFile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).send('No file uploaded.');
            return;
        }

        const filePath = req.file.path;
        const s3Path = req.file.filename;

        const fileToUpload = fs.readFileSync(filePath);
        const wb = xlsx.read(fileToUpload, { type: 'buffer' });
        const sheetNames = wb.SheetNames;
        await uploadS3File({
            s3Path,
            body: fileToUpload,
            cache: true,
        });
        const originFile = await OriginFile.create({
            s3Path,
            fileName: getFileName(filePath),
            sheetNames,
        });

        await ExcelFile.create({
            fileName: getFileName(filePath),
            sheets: sheetNames.map((sheetName) => ({
                sheetName,
                headers: [],
                rows: [],
            })),
            fileId: originFile._id.toString(),
        });

        res.status(200).send('File successfully processed and data inserted.');
    } catch (error) {
        console.error('Error processing the file:', error);
        res.status(500).send('Failed to process the file.');
    }
};

export const uploadWordFile = (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).send('No file uploaded.');
            return;
        }

        const typeFile = req.body.type;

        const filePath = req.file.path;

        if (typeFile.toString() == '1') {
            global.localStorage.setItem('wordCapMoi', filePath);
        }
        if (typeFile.toString() == '2') {
            global.localStorage.setItem('wordCapDoi', filePath);
        }
        // Insert the Excel file into the database
        res.status(200).send({
            message: 'File successfully processed and data inserted.',
            filePath: filePath,
        });
    } catch (error) {
        console.error('Error processing the file:', error);
        res.status(500).send('Failed to process the file.');
    }
};

export const uploadMapFile = (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).send('No file uploaded.');
            return;
        }

        const filePath = req.file.path;

        global.localStorage.setItem('templateMapFile', filePath);

        // Insert the Excel file into the database
        res.status(200).send({
            message: 'File successfully uploaded File.',
            filePath: filePath,
        });
    } catch (error) {
        console.error('Error processing the file:', error);
        res.status(500).send('Failed to process the file.');
    }
};

export const getFileData = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;
        const { page, pageSize } = req.query;

        const originFile = await OriginFile.findById(fileId);
        // get file from s3
        if (!originFile || !originFile.s3Path) {
            res.status(404).send('File not found.');
            return;
        }
        const file = await getS3File(originFile.s3Path);
        const wb = xlsx.read(file, { type: 'buffer' });
        const worksheet = wb.Sheets[sheetName];

        const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
        });

        if (jsonData.length === 0) {
            res.status(404).send('Sheet not found.');
            return;
        }

        const sheetHeaders = jsonData[0];
        // if header is empty, set header tov value of json data [2]
        const headers = sheetHeaders.map((header, index) => {
            if (header === '') {
                return jsonData[2][index];
            }
            return header;
        });
        const jsonRows = jsonData.slice(1);

        const start = Number(page) * Number(pageSize);
        const end = start + Number(pageSize);
        let rowsToProcess;
        if (end > jsonRows.length) {
            rowsToProcess = jsonRows.slice(start, jsonRows.length);
        } else {
            rowsToProcess = jsonRows.slice(start, end);
        }

        const rows = rowsToProcess.map((row) => {
            const rowObject: any = {};
            headers.forEach((header, index) => {
                rowObject[header] = row[index];
            });

            rowObject.tamY = `${rowObject.soHieuToBanDo}_${rowObject.soThuTuThua}`;
            return rowObject;
        });

        const result = {
            id: originFile._id,
            fileName: originFile.fileName,
            uploadedAt: originFile.uploadedAt,
            sheets: [
                {
                    sheetName,
                    headers,
                    rows,
                },
            ],
            totalRows: jsonRows.length,
        };

        res.json({ data: result });
    } catch (error: any) {
        console.error('Error retrieving file data:', error);
        res.status(500).send('Error retrieving file data: ' + error.message);
    }
};
// get files
export const getFiles = async (_req: Request, res: Response) => {
    try {
        // Fetch files OriginFile
        const files = await OriginFile.find();
        const data = files.map((file) => ({
            id: file._id,
            fileName: file.fileName,
            uploadedAt: file.uploadedAt,
            sheetNames: file.sheetNames,
        }));

        res.json({ data });
    } catch (error) {
        console.error('Error retrieving files:', error);
        res.status(500).send('Error retrieving files');
    }
};
// export file
export const exportFileBySheet = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;

        await exportExcelDataFromDB({ fileId, sheetName });
        const filePath = `${OUTPUT_FILE_PATH}exported_file_${fileId}_${sheetName}.xlsx`;
        res.download(filePath, `exported_file_${sheetName}.xlsx`, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error downloading the file.');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exporting file');
    }
};

export const exportWord = (req: Request, res: Response) => {
    try {
        const { tamY } = req.params;
        const filePath = `${OUTPUT_FILE_PATH}word_file-${tamY}.docx`;

        res.download(filePath, `word_file-${tamY}.docx`, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error downloading the file.');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exporting file');
    }
};

export const exportMap = (req: Request, res: Response) => {
    try {
        let filePath: string = `src/files/templates/`;
        const fullName = localStorage.getItem('templateMapFile');
        if (fullName?.trim() !== '') {
            // Sử dụng regex phù hợp với dấu `\\` hoặc `/` để bắt tên file
            const nameFile = fullName?.match(/templates[\\/](.+)/);

            if (nameFile && nameFile[1]) {
                filePath = `${filePath}${nameFile[1]}`;

                res.download(filePath, nameFile[1], (err: Error) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Error downloading the file.');
                    }
                });
            } else {
                console.error('File name not found in path.');
                res.status(404).send(
                    'Không tìm thấy đường dẫn file lưu bản đồ',
                );
            }
        } else {
            console.error('No template file specified.');
            res.status(404).send('Bạn chưa tải lên file bản đồ');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exporting file');
    }
};

export const exportManyWord = (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;
        const filePath = `${OUTPUT_FILE_PATH}document-${fileId}.zip`;
        res.download(filePath, `document-${fileId}.zip`, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error downloading the file.');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exporting file');
    }
};

// get row data by fileId, sheetName, tamY
export const getFileDataBySheetNameAndTamY = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName, tamY } = req.params;
        let row = null;

        const excelFile = await ExcelFile.findOne({
            fileId: fileId,
            'sheets.sheetName': sheetName,
            'sheets.rows.tamY': tamY,
        });

        if (excelFile) {
            const sheet = excelFile.sheets.find(
                (s) => s.sheetName === sheetName,
            );
            if (sheet) {
                row = sheet.rows.find(
                    (r) =>
                        r.get('tamY') === tamY ||
                        `${r.get('soHieuToBanDo')}_${r.get('soThuTuThua')}` ===
                            tamY,
                );
            }
        } else {
            const originFile = await OriginFile.findById(fileId);
            // get file from s3
            if (!originFile || !originFile.s3Path) {
                res.status(404).send('File not found.');
                return;
            }
            const file = await getS3File(originFile.s3Path);
            const wb = xlsx.read(file, { type: 'buffer' });
            const worksheet = wb.Sheets[sheetName];
            const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                blankrows: false,
            });

            if (jsonData.length === 0) {
                res.status(404).send('Sheet not found.');
                return;
            }

            const sheetHeaders: string[] = jsonData[0];
            // if header is empty, set header tov value of json data [2]
            const headers = sheetHeaders.map((header, index) => {
                if (header === '') {
                    return jsonData[2][index];
                }
                return header;
            });
            const rows = jsonData.slice(1);
            const rowObject: any = {};
            const rowFromJson = rows.find(
                (r: any) =>
                    r[headers.indexOf('tamY')] === tamY ||
                    `${r[headers.indexOf('soHieuToBanDo')]}_${r[headers.indexOf('soThuTuThua')]}` ===
                        tamY,
            );
            if (!rowFromJson) {
                res.status(404).send('Row not found.');
                return;
            }
            headers.forEach((header, index) => {
                rowObject[header] = rowFromJson[index];
            });
            rowObject.tamY = `${rowObject.soHieuToBanDo}_${rowObject.soThuTuThua}`;
            row = rowObject;
        }

        if (!row) {
            res.status(404).send('Row not found.');
            return;
        }
        res.json({ data: row });
    } catch (error: any) {
        console.error('Error retrieving row data:', error);
        res.status(500).send('Error retrieving row data: ' + error.message);
    }
};

// Update or add a row in a sheet
export const updateOrAddRowInSheet = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;
        const rowData = req.body.data;
        const accountId = getAccountIdFromHeader(req);
        const tamY = `${rowData.soHieuToBanDo}_${rowData.soThuTuThua}`;
        const newRow = {
            ...rowData,
            tamY,
            accountId,
        };

        await ExcelFile.findOneAndUpdate(
            { fileId: fileId, 'sheets.sheetName': sheetName },
            { $push: { 'sheets.$.rows': newRow } },
            { new: true },
        );
        res.status(200).json({
            message: 'Row updated successfully',
        });
    } catch (error: any) {
        res.status(500).send('Error updating or adding row: ' + error.message);
    }
};
