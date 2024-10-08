import Docxtemplater from 'docxtemplater';
import { Request, Response } from 'express';
import fs from 'fs';
import {} from 'lodash';
import path from 'path';
import PizZip from 'pizzip';
import ExcelFile from '../models/excelFile';
import { OUTPUT_FILE_PATH } from './functions/exportExcelDataFromDB';

// In dữ liệu từ 1 row ra word
export const exportDataToword = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { fileId, sheetName, rowIndex: rowIndexString } = req.params;
    const rowIndex = parseInt(rowIndexString);

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
    const content = fs.readFileSync(
        path.resolve(__dirname, '../uploads/fileTest.docx'),
        'binary',
    );

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);

    const dataDB = sheet.rows[rowIndex];
    const dataToWord = dataDB.toJSON();
    doc.setData(dataToWord);

    try {
        doc.render();
    } catch (error: any) {
        res.status(500).send('Error generate data to Word' + error.message);
    }

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(`${OUTPUT_FILE_PATH}/output.docx`, buf);
    const filePath = `${OUTPUT_FILE_PATH}/output.docx`;
    res.download(filePath, 'output.docx', (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error downloading the file.');
        }
    });
};
