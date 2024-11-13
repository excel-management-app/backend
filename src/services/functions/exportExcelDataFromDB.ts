import * as ExcelJS from 'exceljs';
import ExcelFile from '../../models/excelFile';
import { RowData, Sheet } from '../types';
import { getGridFsFileById } from './getGridFsFile';
import path from 'path';
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

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXPORT_TEMPLATE_PATH);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) throw new Error('Template sheet not found.');

        // Tạo header từ template
        const templateHeaders: string[] = [];
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            if (cell.value) templateHeaders.push(String(cell.value));
        });

        let startRow = worksheet.actualRowCount + 1;

        // Xử lý từng phần dữ liệu từ MongoDB theo batch
        const batchSize = 50; // Giảm kích thước batch để giảm tải bộ nhớ
        const cursor = ExcelFile.find({ fileName: gridFsFile.filename }).cursor();

        for await (const file of cursor) {
            const fileSheet = file.sheets.find(sheet => sheet.sheetName === sheetName);
            if (!fileSheet) continue;

            const rows = fileSheet.rows;
            for (let i = 0; i < rows.length; i += batchSize) {
                const batchRows = rows.slice(i, i + batchSize);

                batchRows.forEach((rowData, rowIndex) => {
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

                // Giải phóng bộ nhớ của batch
                startRow += batchRows.length;
                batchRows.length = 0; // Clear batch to free memory
            }
        }

        const writableStream = fs.createWriteStream(
            `${OUTPUT_FILE_PATH}exported_file_${fileId}_${sheetName}.xlsx`
        );

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