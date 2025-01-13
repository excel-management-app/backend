import { Request, Response } from 'express';
import { getSheetFileData } from 'services/files/functions/getSheetFileData';

export const getFileData = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;
        const { page = 1, pageSize = 50 } = req.query;

        const start = Number(page) * Number(pageSize);
        const end = start + Number(pageSize);

        const files = await getSheetFileData({
            fileId,
            sheetName,
        });

        if (!files || files.length === 0) {
            res.status(404).send('File not found.');
            return;
        }

        const headers = files[0].sheets[0].headers;
        const sheetRows: any[] = [];
        files.forEach((file) => {
            sheetRows.push(...file.sheets[0].rows);
        });
        const totalRows = sheetRows.length;
        let paginatedRows;
        if (end > sheetRows.length) {
            paginatedRows = sheetRows.slice(start, sheetRows.length);
        } else {
            paginatedRows = sheetRows.slice(start, end);
        }

        const result = {
            id: files[0]._id,
            fileName: files[0].fileName,
            uploadedAt: files[0].uploadedAt,
            sheet: {
                sheetName,
                headers,
                rows: paginatedRows,
            },
            totalRows,
        };

        res.json({ data: result });
    } catch (error: any) {
        console.error('Error retrieving file data:', error);
        res.status(500).send('Error retrieving file data: ' + error.message);
    }
};
