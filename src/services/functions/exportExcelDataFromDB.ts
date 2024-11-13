import * as ExcelJS from 'exceljs';
import path from 'path';
import ExcelFile from '../../models/excelFile';
import { convertIndexedStyles } from '../../utils/exceljs';
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
        }).lean();
        if (!files.length) {
            throw new Error('File not found');
        }

        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
            filename: `${OUTPUT_FILE_PATH}exported_file_${fileId}_${sheetName}.xlsx`,
            useStyles: true,
        });

        const combinedRows: RowData[] = [];
        files.forEach((file) => {
            combinedRows.push(...(file.sheets[0].rows as unknown as RowData[]));
        });

        const worksheet = workbook.addWorksheet(sheetName);

        const templateHeaders: string[] = [];
        const templateWorkbook = new ExcelJS.Workbook();
        await templateWorkbook.xlsx.readFile(EXPORT_TEMPLATE_PATH);
        const templateWorksheet = templateWorkbook.getWorksheet(1);

        if (!templateWorksheet) {
            throw new Error('Template worksheet not found');
        }

        // Store template styles for each row
        const templateStyles = Array.from({ length: 4 }, (_, idx) => {
            const rowIndex = idx + 1;
            const rowStyles: any = {};
            templateWorksheet.getRow(rowIndex).eachCell((cell, colIndex) => {
                rowStyles[colIndex] = convertIndexedStyles(cell);
            });
            return rowStyles;
        });

        // Add headers and apply template styles
        const headerRow = worksheet.addRow([]);
        templateWorksheet.getRow(1).eachCell((cell, colIndex) => {
            if (cell.value) {
                templateHeaders.push(String(cell.value));
                const headerCell = headerRow.getCell(colIndex);
                headerCell.value = cell.value;
                headerCell.style = templateStyles[0][colIndex];
            }
        });
        headerRow.commit();

        // Write first 3 rows with template styles
        combinedRows.slice(0, 3).forEach((rowData: any, rowIndex) => {
            const row = worksheet.addRow([]);
            templateHeaders.forEach((header, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.value = rowData[header];
                cell.style = templateStyles[rowIndex + 1][colIndex + 1] || {};
            });
            row.commit();
        });

        combinedRows.slice(3).forEach((rowData: any) => {
            const row = worksheet.addRow([]);
            templateHeaders.forEach((header, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.value = rowData[header];
                cell.style = {
                    border: {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    },
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
