import * as ExcelJS from 'exceljs';
import path from 'path';
import ExcelFile from '../../models/excelFile';
import { RowData } from '../types';
import { getGridFsFileById } from './getGridFsFile';
import fs from 'fs';

const EXPORT_TEMPLATE_PATH = path.join(
    __dirname,
    '../../files/templates/export_template.xlsx',
);
export const OUTPUT_FILE_PATH = path.join(__dirname, '../../files/exports/');

export async function exportExcelDataFromDB({
    fileId,
    sheetName,
}: {
    fileId: string;
    sheetName: string;
}) {
    try {
        const gridFsFile = await getGridFsFileById(fileId);
        if (!gridFsFile) throw new Error('File not found');

        const files = await ExcelFile.find({ fileName: gridFsFile.filename });
        if (!files.length) throw new Error('File not found');

        const workbook = new ExcelJS.Workbook();
        const writableStream = fs.createWriteStream(
            `${OUTPUT_FILE_PATH}exported_file_${fileId}_${sheetName}.xlsx`
        );

        await workbook.xlsx.readFile(EXPORT_TEMPLATE_PATH);

        const allFileSheets = files.flatMap((file) => file.sheets);
        const combinedSheets = new Map<string, { sheetName: string; rows: RowData[] }>();

        allFileSheets.forEach((sheet) => {
            const sheetName = sheet.sheetName as string;
            if (combinedSheets.has(sheetName)) {
                combinedSheets.get(sheetName)!.rows.push(...sheet.rows.toObject());
            } else {
                combinedSheets.set(sheetName, {
                    sheetName,
                    rows: sheet.rows.toObject() as RowData[],
                });
            }
        });

        const sheetToExport = combinedSheets.get(sheetName);
        if (!sheetToExport) throw new Error('Sheet not found in the template.');

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) throw new Error('Template sheet not found.');

        const templateHeaders: string[] = [];
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            if (cell.value) templateHeaders.push(String(cell.value));
        });

        const rows = sheetToExport.rows;
        const startRow = worksheet.actualRowCount + 1;

        rows.slice(3).forEach((rowData, rowIndex) => {
            const newRow = worksheet.getRow(startRow + rowIndex);

            templateHeaders.forEach((header, colIndex) => {
                const cell = newRow.getCell(colIndex + 1);
                cell.value = rowData.get(header);

                const templateCell = headerRow.getCell(colIndex + 1);
                if (templateCell && templateCell.style) {
                    cell.style = templateCell.style;
                }
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        });

        await workbook.xlsx.write(writableStream);
        writableStream.on('finish', () => {
            console.log('Export completed successfully.');
        });

        writableStream.end();
    } catch (error) {
        console.error('Error processing Excel export:', error);
        throw error;
    }
}