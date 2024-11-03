import * as ExcelJS from 'exceljs';
import ExcelFile from '../../models/excelFile';
import { RowData, Sheet } from '../types';
import { getGridFsFileById } from './getGridFsFile';

const EXPORT_TEMPLATE_PATH = 'src/files/templates/export_template.xlsx';
export const OUTPUT_FILE_PATH = process.env.OUTPUT_FILE_PATH || 'src/files/exports/';
export async function exportExcelDataFromDB({
    fileId,
    sheetName,
}: {
    fileId: string;
    sheetName: string;
}) {
    try {
        const gridFsFile = await getGridFsFileById(fileId);
        if (!gridFsFile) {
            throw new Error('File not found');
        }
        const files = await ExcelFile.find({ fileName: gridFsFile.filename });
        if (!files.length) {
            throw new Error('File not found');
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXPORT_TEMPLATE_PATH);

        const allFileSheets = files.flatMap((file) => file.sheets);
        // combine all sheet with the same name from all files

        const combinedSheets = allFileSheets.reduce<Sheet[]>((acc, sheet) => {
            const existingSheet = acc.find(
                ({ sheetName }) => sheetName === sheet.sheetName,
            );
            if (existingSheet) {
                existingSheet.rows = existingSheet.rows.concat(
                    sheet.rows.toObject(),
                );
                return acc;
            }
            return acc.concat({
                sheetName: sheet.sheetName as string,
                rows: sheet.rows.toObject() as RowData[],
            });
        }, []);

        const sheetToExport = combinedSheets.find(
            (sheet) => sheet.sheetName === sheetName,
        );
        if (!sheetToExport) {
            throw new Error('Sheet not found in the template.');
        }
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            throw new Error(`Sheet not found in the template.`);
        }

        const rows: RowData[] = sheetToExport.rows as unknown as RowData[];

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
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        });

        await workbook.xlsx.writeFile(
            `${OUTPUT_FILE_PATH}exported_file_${fileId}_${sheetName}.xlsx`,
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
}
