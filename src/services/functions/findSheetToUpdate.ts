import ExcelFile from '../../models/excelFile';
import { getGridFsFileById } from './getGridFsFile';

export const findSheetToUpdate = async (fileId: string, sheetName: string) => {
    try {
        const gridFsFile = await getGridFsFileById(fileId);
        if (!gridFsFile) {
            throw new Error('File not found');
        }
        const files = await ExcelFile.find({ fileName: gridFsFile.filename });

        const sheet = files
            .flatMap((file) => file.sheets)
            .find((s) => s.sheetName === sheetName);

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
