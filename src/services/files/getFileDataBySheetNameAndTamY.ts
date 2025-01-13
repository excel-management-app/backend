import { Request, Response } from 'express';
import ExcelFile from 'models/excelFile';

export const getFileDataBySheetNameAndTamY = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName, tamY } = req.params;

        const file = await ExcelFile.findOne({
            gridFSId: fileId,
            sheets: {
                $elemMatch: {
                    sheetName,
                    rows: { $elemMatch: { tamY } },
                },
            },
        })
            .select('sheets.$')
            .lean();

        if (
            !file ||
            !file.sheets ||
            !file.sheets.length ||
            !file.sheets[0].rows.length
        ) {
            res.status(404).send('Row not found.');
            return;
        }

        const row = file.sheets[0].rows.find((r: any) => r.tamY === tamY);
        res.json({ data: row });
    } catch (error: any) {
        console.error('Error retrieving row data:', error);
        res.status(500).send('Error retrieving row data: ' + error.message);
    }
};
