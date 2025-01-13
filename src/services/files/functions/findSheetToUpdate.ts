import ExcelFile from '../../../models/excelFile';

interface Props {
    fileId: string;
    sheetName: string;
    tamY?: string;
}

export const findSheetToUpdate = async ({ fileId, sheetName, tamY }: Props) => {
    try {
        const query: any = {
            gridFSId: fileId,
            sheets: {
                $elemMatch: {
                    sheetName,
                },
            },
        };
        if (tamY) {
            query.sheets.$elemMatch.rows = {
                $elemMatch: {
                    tamY,
                },
            };
        }
        const file = await ExcelFile.findOne(query);

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
