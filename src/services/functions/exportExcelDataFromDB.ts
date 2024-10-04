import * as ExcelJS from 'exceljs';
import MongoDB from '../../db';
import ExcelFile from '../../models/excelFile';
import { RowData } from '../types';

const EXPORT_TEMPLATE_PATH = 'src/files/templates/export_template.xlsx';
const OUTPUT_FILE_PATH = 'src/files/exports/exported_file.xlsx';
export async function exportExcelDataFromDB({ fileId }: { fileId: string }) {
    try {
        const mongoInstance = MongoDB.getInstance();
        await mongoInstance.connect();

        const fileData = await ExcelFile.findById(fileId).exec();
        if (!fileData) {
            throw new Error('File not found');
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXPORT_TEMPLATE_PATH);

        // File Nhap Tong
        const sheetName: string = String(fileData.sheets[1].sheetName);
        const worksheet = workbook.getWorksheet(sheetName);

        if (!worksheet) {
            throw new Error(`Sheet ${sheetName} not found in the template.`);
        }

        const rows: RowData[] = fileData.sheets[1].rows as unknown as RowData[];

        const headerRow = worksheet.getRow(1); // Assuming header is in the first row
        const startRow = worksheet.actualRowCount + 1; // Start after the last row of the template

        const templateHeaders: string[] = [];
        headerRow.eachCell((cell) => {
            if (cell.value) {
                templateHeaders.push(String(cell.value)); // Push into templateHeaders instead of headers
            }
        });

        rows.splice(3).forEach((rowData: any, rowIndex: number) => {
            const newRow = worksheet.getRow(startRow + rowIndex);

            templateHeaders.forEach((header, colIndex) => {
                const cell = newRow.getCell(colIndex + 1); // ExcelJS columns are 1-based

                // Set the value from MongoDB data corresponding to the header
                cell.value = rowData.get(header);

                //  Copy style from the corresponding template header row (or any styled row)
                const templateCell = headerRow.getCell(colIndex + 1); // Copy style from the header row
                if (templateCell && templateCell.style) {
                    cell.style = templateCell.style; // Copy the style from the template cell
                }
            });
        });

        await workbook.xlsx.writeFile(OUTPUT_FILE_PATH);
    } catch (error) {
        console.error(error);
        throw error;
    }
}
