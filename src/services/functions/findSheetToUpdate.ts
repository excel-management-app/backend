import ExcelFile from '../../models/excelFile';

export const findSheetToUpdate = async (fileId: string, sheetName: string) => {
    try {
        const file = await ExcelFile.findOne({
            gridFSId: fileId,
            sheets: { $elemMatch: { sheetName } },
        });

        const sheet = file?.sheets[0];

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
