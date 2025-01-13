import { Request, Response } from 'express';
import OriginFile from 'models/originFile';

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;
        await OriginFile.updateOne(
            { gridFSId: fileId },
            { deletedAt: new Date() },
        );

        res.status(200).send('File deleted successfully.');
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).send('Error deleting file.');
    }
};
