import { Request, Response } from 'express';
import { LocalStorage } from 'node-localstorage';
import ExcelFile from '../models/excelFile';
import {
    exportExcelDataFromDB,
    OUTPUT_FILE_PATH,
} from './functions/exportExcelDataFromDB';
import { getAccountIdFromHeader } from './functions/getAccountIdFromHeader';
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

        if(typeFile.toString() == "1") {
            global.localStorage.setItem('wordCapMoi', filePath);
        } 
        if(typeFile.toString() == "2") {
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
    const { fileId, sheetName } = req.params;
    const newRowData = req.body.data;
    const accountId = getAccountIdFromHeader(req);

    try {
        const tamY = `${newRowData.soHieuToBanDo}_${newRowData.soThuTuThua}`;
        const fileExistsWithSheetAndRow = await ExcelFile.exists({
            _id: fileId,
            'sheets.sheetName': sheetName,
            'sheets.rows': {
                $elemMatch: {
                    $or: [
                        {
                            $and: Object.entries(newRowData).map(
                                ([key, value]) => ({
                                    [key]: value,
                                }),
                            ),
                        },
                        {
                            tamY,
                        },
                    ],
                },
            },
        });
        if (fileExistsWithSheetAndRow) {
            res.status(409).send('Hàng đã tồn tại trong sheet');
            return;
        }
        const file = await ExcelFile.findById(fileId);
        if (!file) {
            res.status(404).send('File not found.');
            return;
        }

        const sheet = file.sheets.find((s) => s.sheetName === sheetName);
        if (!sheet) {
            res.status(404).send('Sheet not found.');
            return;
        }

        sheet.rows.push({
            ...newRowData,
            tamY,
            accountId,
        });

        await file.save();

        res.status(200).send('Row added successfully');
    } catch (error: any) {
        res.status(500).send('Error adding row: ' + error.message);
    }
};

// Sửa một hàng trong sheet
export const updateRowInSheet = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { fileId, sheetName, rowIndex: rowIndexString } = req.params;
    const updatedRow = req.body.data;
    const rowIndex = parseInt(rowIndexString);
    const accountId = getAccountIdFromHeader(req);

    try {
        const file = await ExcelFile.findById(fileId);
        if (!file) {
            res.status(404).send('File not found.');

            return;
        }

        const sheet = file.sheets.find((s) => s.sheetName === sheetName);
        if (!sheet) {
            res.status(404).send('Sheet not found.');

            return;
        }

        if (rowIndex < 0 || rowIndex >= sheet.rows.length) {
            res.status(400).send('Invalid row index.');
            return;
        }

        const newRow = {
            ...updatedRow,
            tamY: `${updatedRow.soHieuToBanDo}_${updatedRow.soThuTuThua}`,
            accountId,
        };

        sheet.rows[rowIndex] = newRow;

        await file.updateOne({ $set: { sheets: file.sheets } });

        res.status(200).json({
            message: 'Row updated successfully',
        });
    } catch (error: any) {
        res.status(500).send('Error updating row: ' + error.message);
    }
};

// Xóa một hàng khỏi sheet
export const deleteRowFromSheet = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { fileId, sheetName, rowIndex: rowIndexString } = req.params;
    const rowIndex = parseInt(rowIndexString);

    try {
        const file = await ExcelFile.findById(fileId);
        if (!file) {
            res.status(404).send('File not found.');
            return;
        }

        const sheet = file.sheets.find((s) => s.sheetName === sheetName);
        if (!sheet) {
            res.status(404).send('Sheet not found.');
            return;
        }

        if (rowIndex < 0 || rowIndex >= sheet.rows.length) {
            res.status(400).send('Invalid row index.');
            return;
        }

        sheet.rows.splice(rowIndex, 1);

        await file.save();

        res.status(200).json({
            message: 'Row deleted successfully',
        });
    } catch (error: any) {
        res.status(500).send('Error deleting row: ' + error.message);
    }
};

export const getFileData = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { fileId } = req.params;

    try {
        const file = await ExcelFile.findById(fileId);

        if (!file) {
            res.status(404).send('File not found.');

            return;
        }

        res.status(200).json({ data: file });
    } catch (error: any) {
        res.status(500).send('Error retrieving file data: ' + error.message);
    }
};

// get files
export const getFiles = async (_req: Request, res: Response) => {
    try {
        const files = await ExcelFile.find();
        const data = files.map((file) => ({
            id: file._id,
            fileName: file.fileName.replace(/^\d+-/, ''),
        }));
        res.json({ data });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving files');
    }
};

// export file
export const exportFile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { fileId } = req.params;

    try {
        await exportExcelDataFromDB({ fileId });
        const filePath = `${OUTPUT_FILE_PATH}exported_file${fileId}.xlsx`;
        res.download(filePath, 'exported_file.xlsx', (err) => {
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
    const { rowIndex } = req.params;
    console.log("fileId======", rowIndex);
    try {
        const filePath = `${OUTPUT_FILE_PATH}word_file-${rowIndex}.docx`;

        
        // console.log("path===",path.resolve(__dirname, fileName))
        // res.download('src/files/exports/', fileName, (err) => {
        //     if (err) {
        //         console.error(err);
        //         res.status(500).send('Error downloading the file.');
        //     }
        // });
        res.download(filePath, `word_file-${rowIndex}.docx`, (err) => {
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
    const { fileId } = req.params;
    console.log("fileId======", fileId);
    try {
        
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
