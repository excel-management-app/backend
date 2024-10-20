import ExcelFile from '../../models/excelFile';
import { RowData, Sheet } from '../types';
import { getGridFsFileById } from './getGridFsFile';

export const findSheetToUpdate = async (fileId: string, sheetName: string) => {
    try {
        const gridFsFile = await getGridFsFileById(fileId);
        if (!gridFsFile) {
            throw new Error('File not found');
        }
        const files = await ExcelFile.find({ fileName: gridFsFile.filename });
        const allFileSheets = files.flatMap((file) => file.sheets);
        // combine all sheet with the same name from all files

        const sheets = allFileSheets.reduce<any[]>((acc, sheet) => {
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

        const sheet = sheets.find((s) => s.sheetName === sheetName);

        if (!sheet) {
            throw new Error('Sheet not found');
        }
        return sheet;
    } catch (error) {
        throw new Error(
            `Failed to find sheet to update: ${(error as Error).message}`,
        );
    }
};
