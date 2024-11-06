/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Request, Response } from 'express';
import { GridFSBucket } from 'mongodb';
import { LocalStorage } from 'node-localstorage';
import MongoDB from '../db';
import ExcelFile from '../models/excelFile';
import {
    exportExcelDataFromDB,
    OUTPUT_FILE_PATH,
} from './functions/exportExcelDataFromDB';
import { getAccountIdFromHeader } from './functions/getAccountIdFromHeader';
import { insertExcelDataToDB } from './functions/insertExcelDataToDB';
import { getFileDataByFileId } from './functions/getFileDataByFileId';
import { checkRowExist } from './functions/checkRowExist';
import { uploadS3File } from '../s3/uploadS3File';
import fs from 'fs';

global.localStorage = new LocalStorage('./scratch');

export const uploadExcelFile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        // get file from request without multer
        console.log(req.res);
        if (!req.file) {
            res.status(400).send('No file uploaded.');
            return;
        }

        const filePath = req.file.path;

        const fileToUpload = fs.readFileSync(filePath);

        const result = await uploadS3File({
            s3Path: req.file.filename,
            body: fileToUpload,
            cache: true,
        });

        // Insert the Excel file into the database
        await insertExcelDataToDB(filePath);

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
        const { fileId } = req.params;

        const files = await getFileDataByFileId(fileId);
        const firstFile = files[0];

        // combine data to result with baseFileInfo and sheets data from files

        const result = {
            id: firstFile._id,
            fileName: firstFile.fileName,
            uploadedAt: firstFile.uploadedAt,
            sheets: files.reduce(
                (
                    acc: {
                        sheetName: string;
                        headers: string[];
                        rows: any[];
                    }[],
                    file,
                ) => {
                    file.sheets.forEach((sheet) => {
                        const existingSheet = acc.find(
                            (s) => s.sheetName === sheet.sheetName,
                        );
                        if (existingSheet) {
                            existingSheet.rows.push(...sheet.rows);
                        } else {
                            acc.push({
                                sheetName: sheet.sheetName as string,
                                headers: sheet.headers as string[],
                                rows: sheet.rows,
                            });
                        }
                    });
                    return acc;
                },
                [],
            ),
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
        // Fetch files from GridFS
        const mongoInstance = MongoDB.getInstance();
        const db = (await mongoInstance.connect()).db;
        if (!db) {
            throw new Error('Failed to connect to the database');
        }
        const bucket = new GridFSBucket(db, { bucketName: 'excelFiles' });
        const filesCursor = bucket.find();
        const gridFsFiles = await filesCursor.toArray();
        const gridFsFilesMap = gridFsFiles.map((file) => ({
            id: file._id.toString(),
            fileName: file.filename,
        }));

        res.json({ data: gridFsFilesMap });
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

        const files = await getFileDataByFileId(fileId);

        if (!files || files.length === 0) {
            res.status(404).send('File not found.');
            return;
        }

        let row = null;
        for (const file of files) {
            const sheet = file.sheets.find(
                (s: any) => s.sheetName === sheetName,
            );
            if (sheet) {
                row = sheet.rows.find(
                    (r: any) =>
                        r.tamY === tamY ||
                        `${r.soHieuToBanDo}_${r.soThuTuThua}` === tamY,
                );
                if (row) {
                    break;
                }
            }
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

        const files = await getFileDataByFileId(fileId);

        if (!files || files.length === 0) {
            res.status(404).send('File not found.');
            return;
        }

        const { fileToUpdate, sheetToUpdate, rowIndexToUpdate } = checkRowExist(
            { files, sheetName, tamY },
        );
        const newRow = {
            ...rowData,
            tamY,
            accountId,
        };
        if (fileToUpdate && sheetToUpdate && rowIndexToUpdate !== -1) {
            // Update existing row

            sheetToUpdate.rows[rowIndexToUpdate] = newRow;

            await ExcelFile.findOneAndUpdate(
                { _id: fileToUpdate._id, 'sheets.sheetName': sheetName },
                { $set: { 'sheets.$.rows': sheetToUpdate.rows } },
                { new: true },
            );
            res.status(200).json({
                message: 'Row updated successfully',
            });
        } else {
            // Add new row
            const sheet = files
                .flatMap((file) => file.sheets)
                .find((s) => s.sheetName === sheetName);

            if (!sheet) {
                res.status(404).send('Sheet not found.');
                return;
            }

            sheet.rows.push({
                ...rowData,
                tamY,
                accountId,
            });

            const fileToUpdate = files.find((file) =>
                file.sheets.some((sheet) => sheet.sheetName === sheetName),
            );

            if (fileToUpdate) {
                await ExcelFile.findOneAndUpdate(
                    { _id: fileToUpdate._id, 'sheets.sheetName': sheetName },
                    { $push: { 'sheets.$.rows': newRow } },
                    { new: true },
                );
            }
            res.status(200).json({
                message: 'Row added successfully',
                tamY,
            });
        }
    } catch (error: any) {
        res.status(500).send('Error updating or adding row: ' + error.message);
    }
};
