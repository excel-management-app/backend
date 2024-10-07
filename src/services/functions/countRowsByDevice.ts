import mongoose from 'mongoose';
import ExcelFile from '../../models/excelFile';
const { ObjectId } = mongoose.Types; // Destructure ObjectId for easier usage

export async function countRowsByDevice({
    deviceId,
    fileId,
    sheetName,
}: {
    fileId: string;
    deviceId: string;
    sheetName: string;
}): Promise<number> {
    try {
        const result = await ExcelFile.aggregate([
            {
                $match: { _id: new ObjectId(fileId) },
            },
            {
                $unwind: '$sheets',
            },
            {
                $match: { 'sheets.sheetName': sheetName },
            },
            {
                $unwind: '$sheets.rows',
            },
            {
                $match: { 'sheets.rows.deviceId': deviceId },
            },

            {
                $count: 'rowCount',
            },
        ]);

        return result.length > 0 ? result[0].rowCount : 0;
    } catch (error) {
        console.error('Error counting rows:', error);
        throw error;
    }
}
