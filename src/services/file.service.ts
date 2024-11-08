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

export const getFileData = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId } = req.params;
        const files = await getFileDataByFileId(fileId);

        if (!files || files.length === 0) {
            res.status(404).send('File not found.');
            return;
        }

        const sheetMap = new Map<
            string,
            { sheetName: string; headers: string[]; rows: any[] }
        >();

        files.forEach((file) => {
            file.sheets.forEach((sheet) => {
                // Kiểm tra nếu sheetName có giá trị và là kiểu string
                if (
                    typeof sheet.sheetName === 'string' &&
                    sheet.sheetName.trim() !== ''
                ) {
                    // Ép kiểu sheetName về string nếu cần thiết
                    const sheetName = sheet.sheetName;

                    // Kiểm tra và ép kiểu sheet.headers thành string[] nếu cần thiết
                    const headers = Array.isArray(sheet.headers)
                        ? sheet.headers.map((header) => String(header)) // Chuyển các phần tử thành string nếu chưa phải
                        : [];

                    if (!sheetMap.has(sheetName)) {
                        sheetMap.set(sheetName, {
                            sheetName,
                            headers,
                            rows: [...sheet.rows],
                        });
                    } else {
                        sheetMap.get(sheetName)!.rows.push(...sheet.rows);
                    }
                } else {
                    console.warn(
                        `Invalid sheet name: ${String(sheet.sheetName)}`,
                    );
                }
            });
        });

        const result = {
            id: files[0]._id,
            fileName: files[0].fileName,
            uploadedAt: files[0].uploadedAt,
            sheets: Array.from(sheetMap.values()),
        };

        res.json({ data: result });
    } catch (error: any) {
        console.error('Error retrieving file data:', error);
        res.status(500).send('Error retrieving file data: ' + error.message);
    }
};

export const getFiles = async (_req: Request, res: Response): Promise<void> => {
    try {
        const mongoInstance = MongoDB.getInstance();
        const db = (await mongoInstance.connect()).db;
        if (!db) {
            throw new Error('Failed to connect to the database');
        }

        const bucket = new GridFSBucket(db, { bucketName: 'excelFiles' });
        const filesCursor = bucket.find(
            {},
            { projection: { _id: 1, filename: 1 } },
        ); // Chỉ lấy các trường cần thiết

        const gridFsFiles = await filesCursor.toArray();

        res.json({
            data: gridFsFiles.map((file) => ({
                id: file._id.toString(),
                fileName: file.filename,
            })),
        });
    } catch (error) {
        console.error('Error retrieving files:', error);
        res.status(500).send('Error retrieving files');
    }
};

export const getFileDataBySheetNameAndTamY = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName, tamY } = req.params;

        const file = await ExcelFile.findOne({
            gridFSId: fileId,
            sheets: {
                $elemMatch: {
                    sheetName,
                    rows: { $elemMatch: { tamY } },
                },
            },
        }).select('sheets.$').lean();

        if (!file || !file.sheets.length || !file.sheets[0].rows.length) {
            res.status(404).send('Row not found.');
            return;
        }

        const row = file.sheets[0].rows.find((r: any) => r.tamY === tamY);
        res.json({ data: row });
    } catch (error: any) {
        console.error('Error retrieving row data:', error);
        res.status(500).send('Error retrieving row data: ' + error.message);
    }
};


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

        // Destructuring để dễ truy cập và sử dụng
        const { fileToUpdate, sheetToUpdate, rowIndexToUpdate } = checkRowExist({
            files,
            sheetName,
            tamY,
        });

        const newRow = {
            ...rowData,
            tamY,
            accountId,
        };

        // Nếu tìm thấy file và sheet, tiến hành cập nhật hoặc thêm row
        if (fileToUpdate && sheetToUpdate) {
            if (rowIndexToUpdate !== -1) {
                // Cập nhật row đã tồn tại
                await ExcelFile.bulkWrite([
                    {
                        updateOne: {
                            filter: { _id: fileToUpdate._id, 'sheets.sheetName': sheetName },
                            update: { $set: { 'sheets.$.rows.$[row]': newRow } },
                            arrayFilters: [{ 'row.tamY': tamY }],
                        },
                    },
                ]);
                res.status(200).json({ message: 'Row updated successfully' });
            } else {
                // Thêm row mới vào sheet đã tồn tại
                await ExcelFile.updateOne(
                    { _id: fileToUpdate._id, 'sheets.sheetName': sheetName },
                    { $push: { 'sheets.$.rows': newRow } },
                );
                res.status(200).json({ message: 'Row added successfully', tamY });
            }
        } else if (fileToUpdate) {
            // Nếu file tồn tại nhưng sheet chưa có, thêm sheet và row mới
            await ExcelFile.updateOne(
                { _id: fileToUpdate._id },
                { $push: { sheets: { sheetName, rows: [newRow] } } }
            );
            res.status(200).json({ message: 'Sheet and row added successfully', tamY });
        } else {
            res.status(404).send('File not found for update or addition.');
        }
    } catch (error: any) {
        console.error('Error updating or adding row:', error);
        res.status(500).send('Error updating or adding row: ' + error.message);
    }
};
