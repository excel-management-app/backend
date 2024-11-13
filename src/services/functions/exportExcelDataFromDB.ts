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

        // Tạo workbook và worksheet từ template có sẵn
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXPORT_TEMPLATE_PATH);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) throw new Error('Template sheet not found.');

        // Đọc và xử lý dữ liệu từng phần bằng stream từ MongoDB
        const cursor = ExcelFile.find({ fileName: gridFsFile.filename }).cursor();
        
        // Tạo header từ template
        const templateHeaders: string[] = [];
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            if (cell.value) templateHeaders.push(String(cell.value));
        });

        let startRow = worksheet.actualRowCount + 1;

        // Stream từng document từ MongoDB
        for await (const file of cursor) {
            const fileSheet = file.sheets.find(sheet => sheet.sheetName === sheetName);
            if (!fileSheet) continue;

            // Chỉ xử lý từng batch hàng trong sheet để tiết kiệm bộ nhớ
            const rows = fileSheet.rows;
            for (let i = 3; i < rows.length; i += 100) { // Batch size 100
                const batchRows = rows.slice(i, i + 100);

                batchRows.forEach((rowData, rowIndex) => {
                    const newRow = worksheet.getRow(startRow + rowIndex);

                    templateHeaders.forEach((header, colIndex) => {
                        const cell = newRow.getCell(colIndex + 1);
                        cell.value = rowData.get(header);

                        // Copy style từ template
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

                startRow += batchRows.length;
            }
        }

        // Ghi workbook ra file bằng stream để tiết kiệm bộ nhớ
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