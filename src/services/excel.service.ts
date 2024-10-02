import { Request, Response } from 'express';
import ExcelFile from '../models/excelFile';
import { insertExcelDataToDB } from './functions/insertExcelDataToDB';
import {} from 'lodash';

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

// Thêm hàng mới vào một sheet cụ thể
export const addRowToSheet = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { fileId, sheetName } = req.params;
    const newRow = req.body;

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

        sheet.rows.push(newRow);

        await file.save();

        res.status(200).json({ message: 'Row added successfully', file });
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
    const updatedRow = req.body;
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

        sheet.rows[rowIndex] = updatedRow;

        await file.updateOne({ $set: { sheets: file.sheets } });

        res.status(200).json({ message: 'Row updated successfully', file });
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

        res.status(200).json({ message: 'Row deleted successfully', file });
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

        res.status(200).json(file);
    } catch (error: any) {
        res.status(500).send('Error retrieving file data: ' + error.message);
    }
};
