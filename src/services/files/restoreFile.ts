import { Request, Response } from 'express';
import OriginFile from 'models/originFile';

export const restoreFile = async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;
        await OriginFile.updateOne({ gridFSId: fileId }, { deletedAt: null });

        res.status(200).send('File restored successfully.');
    } catch (error) {
        console.error('Error restoring file:', error);
        res.status(500).send('Error restoring file.');
    }
};
