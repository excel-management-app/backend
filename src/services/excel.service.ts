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
import { getGridFsFileById } from './functions/getGridFsFile';
import { insertExcelDataToDB } from './functions/insertExcelDataToDB';
import { RowData, Sheet } from './types';

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

// Thêm hàng mới vào một sheet cụ thể
export const addRowToSheet = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;
        const newRowData = req.body.data;
        const accountId = getAccountIdFromHeader(req);
        const tamY = `${newRowData.soHieuToBanDo}_${newRowData.soThuTuThua}`;

        const gridFsFile = await getGridFsFileById(fileId);

        if (!gridFsFile) {
            res.status(404).send('File not found.');
            return;
        }

        const files = await ExcelFile.find({ fileName: gridFsFile.filename });

        if (files.length === 0) {
            res.status(404).send('File not found.');
            return;
        }

        // kiểm tra dữ liệu trùng
        const fileExistsWithSheetAndRow = files.some((file) =>
            file.sheets.some(
                (sheet) =>
                    sheet.sheetName === sheetName &&
                    sheet.rows.some(
                        (row) =>
                            row.get('tamY') === tamY ||
                            Object.entries(newRowData).every(
                                ([key, value]) => row.get(key) === value,
                            ),
                    ),
            ),
        );

        if (fileExistsWithSheetAndRow) {
            res.status(409).send('Hàng đã tồn tại trong sheet');
            return;
        }

        const sheet = files
            .flatMap((file) => file.sheets)
            .find((s) => s.sheetName === sheetName);

        if (!sheet) {
            res.status(404).send('Sheet not found.');
            return;
        }

        sheet.rows.push({
            ...newRowData,
            tamY,
            accountId,
        });

        const fileToUpdate = files.find((file) =>
            file.sheets.some((sheet) => sheet.sheetName === sheetName),
        );

        if (fileToUpdate) {
            await fileToUpdate.save();
        }
        res.status(200).json({
            message: 'Row added successfully',
            tamY,
        });
    } catch (error: any) {
        res.status(500).send('Error adding row: ' + error.message);
    }
};

// Sửa một hàng trong sheet
export const updateRowInSheet = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;
        const updatedRow = req.body.data;

        const accountId = getAccountIdFromHeader(req);
        const gridFsFile = await getGridFsFileById(fileId);
        const tamY = `${updatedRow.soHieuToBanDo}_${updatedRow.soThuTuThua}`;

        if (!gridFsFile) {
            res.status(404).send('File not found.');
            return;
        }

        const files = await ExcelFile.find({ fileName: gridFsFile.filename });

        if (files.length === 0) {
            res.status(404).send('File not found.');
            return;
        }

        const allFileSheets = files.flatMap((file) => file.sheets);

        const combinedSheets = allFileSheets.reduce<Sheet[]>((acc, sheet) => {
            const existingSheet = acc.find(
                ({ sheetName }) => sheetName === sheet.sheetName,
            );
            if (existingSheet) {
                existingSheet.rows = existingSheet.rows.concat(
                    sheet.rows.toObject(),
                );
                return acc;
            }
            return acc.concat({
                sheetName: sheet.sheetName as string,
                rows: sheet.rows.toObject() as RowData[],
            });
        }, []);

        const sheet = combinedSheets.find(
            (s) => s.sheetName === sheetName,
        ) as Sheet;

        if (!sheet) {
            res.status(404).send('Sheet not found.');
            return;
        }
        const rowIndexToUpdate = sheet.rows.findIndex(
            (row) =>
                row.get('tamY') === tamY ||
                (row.get('soHieuToBanDo') === updatedRow.soHieuToBanDo &&
                    row.get('soThuTuThua') === updatedRow.soThuTuThua),
        );

        if (rowIndexToUpdate === -1) {
            res.status(404).send('Row not found.');
            return;
        }

        const fileToUpdate = files.find(
            (file) =>
                file.sheets.some(
                    (innerSheet) => innerSheet.sheetName === sheetName,
                ) &&
                file.sheets.some((innerSheet) =>
                    innerSheet.rows.some(
                        (row) =>
                            row.get('tamY') === tamY ||
                            (row.get('soHieuToBanDo') ===
                                updatedRow.soHieuToBanDo &&
                                row.get('soThuTuThua') ===
                                    updatedRow.soThuTuThua),
                    ),
                ),
        );
        if (!fileToUpdate) {
            res.status(404).send('File not found.');
            return;
        }
        console.log('fileToUpdate', fileToUpdate);
        const newRow = {
            ...updatedRow,
            tamY,
            accountId,
        };
        const sheetToUpdate = fileToUpdate?.sheets.find(
            (s) => s.sheetName === sheetName,
        );
        if (!sheetToUpdate) {
            res.status(404).send('Sheet not found.');
            return;
        }

        sheetToUpdate.rows.set(rowIndexToUpdate, newRow);

        if (fileToUpdate) {
            await ExcelFile.findOneAndUpdate(
                { _id: fileToUpdate._id },
                { $set: { sheets: sheetToUpdate } },
                { new: true },
            );
        }

        res.status(200).json({
            message: 'Row updated successfully',
        });
    } catch (error: any) {
        res.status(500).send('Error updating row: ' + error.message);
    }
};

export const getFileData = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId } = req.params;
        const gridFsFile = await getGridFsFileById(fileId);

        // find and combine all sheets of the file into one array of rows
        // find base on gridFSId
        const files = await ExcelFile.find({ fileName: gridFsFile.filename });
        const firstFile = files[0];

        // combine data to result with baseFileInfo and sheets data from files

        const result = {
            id: firstFile._id,
            fileName: firstFile.fileName,
            uploadedAt: firstFile.uploadedAt,
            sheets: files.reduce(
                (
                    acc: { sheetName: string; headers: any; rows: any[] }[],
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
                                headers: sheet.headers,
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
