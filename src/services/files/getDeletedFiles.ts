import { Request, Response } from 'express';
import OriginFile from 'models/originFile';
import { mapFileResult } from 'services/files/functions/mapFileResult';

export const getDeletedFiles = async (_req: Request, res: Response) => {
    try {
        const files = await OriginFile.find({
            deletedAt: { $ne: null },
        }).sort({ uploadedAt: -1 });
        const data = files.map(mapFileResult);

        res.json({ data });
    } catch (error) {
        console.error('Error retrieving files:', error);
        res.status(500).send('Error retrieving files');
    }
};
