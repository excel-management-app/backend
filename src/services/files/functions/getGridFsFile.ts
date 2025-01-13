import mongoose from 'mongoose';
import MongoDB from '../../../db';
import { GridFSBucket, ObjectId } from 'mongodb';

export const getGridFsFileById = async (fileId: string) => {
    // Ensure fileId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        throw new Error('Invalid file ID');
    }
    const mongoInstance = MongoDB.getInstance();
    const db = (await mongoInstance.connect()).db;
    if (!db) {
        throw new Error('Failed to connect to the database');
    }
    const bucket = new GridFSBucket(db, { bucketName: 'excelfiles' });
    const fileCursor = bucket.find({ _id: new ObjectId(fileId) }, { limit: 1 });
    const gridFsFile = await fileCursor.next();
    if (!gridFsFile) {
        throw new Error('File not found');
    }
    return gridFsFile;
};
