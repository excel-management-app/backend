import * as ExcelJS from 'exceljs';
import fs from 'fs';
import ExcelFile from '../../models/excelFile';
import { RowData } from '../types';
import { EXPORTS_PATH, TEMPLATES_PATH } from 'storages/consts';

const EXPORT_TEMPLATE_PATH = `${TEMPLATES_PATH}/export_template.xlsx`;

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
        })
            .select('sheets.rows')
            .lean();

        if (!files.length) {
            throw new Error('File not found');
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXPORT_TEMPLATE_PATH);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            throw new Error(`Sheet not found in the template.`);
        }

        const headerRow = worksheet.getRow(1);
        const startRow = worksheet.actualRowCount + 1;

        const templateHeaders: string[] = [];
        const headerStyles: any[] = [];

        // Extract headers and their styles once
        headerRow.eachCell((cell) => {
            if (cell.value) {
                templateHeaders.push(String(cell.value));
                headerStyles.push(cell.style);
            }
        });

        // Retrieve all row data from files
        const rows: any[] = [];
        for (let i = 0; i < files.length; i++) {
            rows.push(...(files[i].sheets[0].rows as unknown as RowData[]));
        }
        // Process rows in batches for better performance
        const rowDataBatch = rows.slice(3); // Start after first few rows if necessary
        rowDataBatch.forEach((rowData, rowIndex) => {
            const newRow = worksheet.getRow(startRow + rowIndex);

            // Apply data and style from the template headers
            templateHeaders.forEach((header, colIndex) => {
                const cell = newRow.getCell(colIndex + 1);
                cell.value = rowData[header] as string;
                cell.style = headerStyles[colIndex]; // Apply header style

                // Set border for each cell (could add this as part of headerStyles if consistent)
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        });

        const outputFilePath = `${EXPORTS_PATH}/exported_file_${fileId}_${sheetName}.xlsx`;

        return new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(outputFilePath);

            stream.on('error', (error) => {
                console.error('Stream error:', error);
                reject(new Error(error.message));
            });

            stream.on('finish', () => {
                resolve(outputFilePath);
            });

            workbook.xlsx
                .write(stream)
                .then(() => {
                    stream.end();
                })
                .catch((error) => {
                    stream.end();
                    reject(new Error(error.message));
                });
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}
