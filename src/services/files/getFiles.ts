import { Request, Response } from 'express';
import OriginFile from 'models/originFile';
import { mapFileResult } from 'services/files/functions/mapFileResult';

export const getFiles = async (_req: Request, res: Response) => {
    try {
        const files = await OriginFile.find({
            deletedAt: { $eq: null },
        }).sort({ uploadedAt: -1 });
        const data = files.map(mapFileResult);

        res.json({ data });
    } catch (error) {
        console.error('Error retrieving files:', error);
        res.status(500).send('Error retrieving files');
    }
};
