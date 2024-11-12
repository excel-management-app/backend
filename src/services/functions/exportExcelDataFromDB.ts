import * as ExcelJS from 'exceljs';
import path from 'path';
import ExcelFile from '../../models/excelFile';
import { RowData } from '../types';

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
        const files = await ExcelFile.find({
            gridFSId: fileId,
            sheets: { $elemMatch: { sheetName: sheetName } },
        });
        if (!files.length) {
            throw new Error('File not found');
        }

        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
            filename: `${OUTPUT_FILE_PATH}exported_file_${fileId}_${sheetName}.xlsx`,
        });

        const combinedRows: RowData[] = [];
        files.forEach((file) => {
            combinedRows.push(...file.sheets[0].rows.toObject());
        });

        const worksheet = workbook.addWorksheet(sheetName);

        // Write header row
        const headerRow = worksheet.addRow([]);
        const templateHeaders: string[] = [];
        const templateWorkbook = new ExcelJS.Workbook();
        await templateWorkbook.xlsx.readFile(EXPORT_TEMPLATE_PATH);
        const templateWorksheet = templateWorkbook.getWorksheet(1);
        if (!templateWorksheet) {
            throw new Error('Template worksheet not found');
        }

        templateWorksheet.getRow(1).eachCell((cell, colIndex) => {
            if (cell.value) {
                templateHeaders.push(String(cell.value));
                headerRow.getCell(colIndex).value = cell.value;
                headerRow.getCell(colIndex).style = cell.style; // Apply header style once
            }
        });

        // Write data rows
        combinedRows.splice(3).forEach((rowData: any) => {
            const row = worksheet.addRow([]);
            templateHeaders.forEach((header, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.value = rowData.get(header);

                const templateCell = headerRow.getCell(colIndex + 1); // Copy style from the header row
                if (templateCell && templateCell.style) {
                    cell.style = templateCell.style; // Copy the style from the template cell
                }

                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
            row.commit();
        });

        worksheet.commit();
        await workbook.commit();
    } catch (error) {
        console.error(error);
        throw error;
    }
}
