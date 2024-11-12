/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Request, Response } from 'express';
import { LocalStorage } from 'node-localstorage';
import ExcelFile from '../models/excelFile';
import OriginFile from '../models/originFile';
import { checkRowExist } from './functions/checkRowExist';
import {
    exportExcelDataFromDB,
    OUTPUT_FILE_PATH,
} from './functions/exportExcelDataFromDB';
import { getAccountIdFromHeader } from './functions/getAccountIdFromHeader';
import { getFileDataByFileId } from './functions/getFileDataByFileId';
import { getSheetFileData } from './functions/getSheetFileData';
import { insertExcelDataToDB } from './functions/insertExcelDataToDB';

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
        const { fileId, sheetName } = req.params;
        const { page = 1, pageSize = 50 } = req.query;

        const start = Number(page) * Number(pageSize);
        const end = start + Number(pageSize);

        const files = await getSheetFileData({
            fileId,
            sheetName,
        });

        if (!files || files.length === 0) {
            res.status(404).send('File not found.');
            return;
        }

        const headers = files[0].sheets[0].headers;
        const sheetRows: any[] = [];
        files.forEach((file) => {
            sheetRows.push(...file.sheets[0].rows);
        });
        const totalRows = sheetRows.length;
        let paginatedRows;
        if (end > sheetRows.length) {
            paginatedRows = sheetRows.slice(start, sheetRows.length);
        } else {
            paginatedRows = sheetRows.slice(start, end);
        }

        const result = {
            id: files[0]._id,
            fileName: files[0].fileName,
            uploadedAt: files[0].uploadedAt,
            sheet: {
                sheetName,
                headers,
                rows: paginatedRows,
            },
            totalRows,
        };

        res.json({ data: result });
    } catch (error: any) {
        console.error('Error retrieving file data:', error);
        res.status(500).send('Error retrieving file data: ' + error.message);
    }
};

export const getAllRowsBySheetName = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;

        const file = await ExcelFile.findOne({
            gridFSId: fileId,
            sheets: { $elemMatch: { sheetName } },
        })
            .select('sheets.$')
            .lean();

        if (!file || !file.sheets || !file.sheets.length) {
            res.status(404).send('Sheet not found.');
            return;
        }

        const rows = file.sheets[0].rows;
        res.json(rows);
    } catch (error: any) {
        console.error('Error retrieving row data:', error);
        res.status(500).send('Error retrieving row data: ' + error.message);
    }
};

export const getFiles = async (_req: Request, res: Response) => {
    try {
        // Fetch files OriginFile
        const files = await OriginFile.find();
        const data = files.map((file) => ({
            id: file.gridFSId?.toString(), // Thay đổi id thành gridFSId
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
        })
            .select('sheets.$')
            .lean();

        if (
            !file ||
            !file.sheets ||
            !file.sheets.length ||
            !file.sheets[0].rows.length
        ) {
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
        const { fileToUpdate, sheetToUpdate, rowIndexToUpdate } = checkRowExist(
            {
                files,
                sheetName,
                tamY,
            },
        );

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
                            filter: {
                                _id: fileToUpdate._id,
                                'sheets.sheetName': sheetName,
                            },
                            update: {
                                $set: { 'sheets.$.rows.$[row]': newRow },
                            },
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
                res.status(200).json({
                    message: 'Row added successfully',
                    tamY,
                });
            }
        } else if (fileToUpdate) {
            // Nếu file tồn tại nhưng sheet chưa có, thêm sheet và row mới
            await ExcelFile.updateOne(
                { _id: fileToUpdate._id },
                { $push: { sheets: { sheetName, rows: [newRow] } } },
            );
            res.status(200).json({
                message: 'Sheet and row added successfully',
                tamY,
            });
        } else {
            res.status(404).send('File not found for update or addition.');
        }
    } catch (error: any) {
        console.error('Error updating or adding row:', error);
        res.status(500).send('Error updating or adding row: ' + error.message);
    }
};
