import { GridFSBucket } from 'mongodb';
import { Request, Response } from 'express';
import ExcelFile from 'models/excelFile';
import OriginFile from 'models/originFile';
import MongoDB from 'db';

export const permanentlyDeleteFile = async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;
        const file = await OriginFile.findOne({ gridFSId: fileId });
        if (!file || !file.gridFSId) {
            res.status(404).send('File not found.');
            return;
        }

        await file.deleteOne();
        // delete excel file in database
        await ExcelFile.deleteMany({ gridFSId: fileId });
        // delete in gridFS
        const mongoInstance = MongoDB.getInstance();
        const db = (await mongoInstance.connect()).db;
        if (!db) {
            throw new Error('Failed to connect to the database');
        }
        const bucket = new GridFSBucket(db, {
            bucketName: 'excelfiles',
        });
        await bucket.delete(file.gridFSId);
        res.status(200).send('File deleted successfully.');
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).send('Error deleting file.');
    }
};
