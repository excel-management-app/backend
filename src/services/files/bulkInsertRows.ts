import { Request, Response } from 'express';
import { chunk } from 'lodash';
import ExcelFile from 'models/excelFile';
import { ROW_BATCH_SIZE } from 'services/consts';
import { checkRowExist } from 'services/files/functions/checkRowExist';
import { getFileDataByFileId } from 'services/files/functions/getFileDataByFileId';

export const bulkInsertRows = async (req: Request, res: Response) => {
    try {
        const { fileId, sheetName } = req.params;
        const newRows = req.body.data;

        // Chunk rows into batches for bulk insert
        const rowChunks = chunk(newRows, ROW_BATCH_SIZE);

        // Fetch the file data only once per chunk
        const files = await getFileDataByFileId(fileId);

        // Process row chunks concurrently
        const insertPromises = rowChunks.map(async (rowChunk) => {
            // Process each row in the current chunk
            const rowInsertPromises = rowChunk.map(async (newRow) => {
                const tamY = `${(newRow as any).soHieuToBanDo}_${(newRow as any).soThuTuThua}`;
                const { fileToUpdate, sheetToUpdate, rowIndexToUpdate } =
                    checkRowExist({
                        files,
                        sheetName,
                        tamY,
                    });

                // If the row exists, skip the insertion
                if (fileToUpdate && sheetToUpdate && rowIndexToUpdate !== -1) {
                    return; // Skip existing row
                }

                // Insert the new row into the sheet
                await ExcelFile.updateOne(
                    { gridFSId: fileId, 'sheets.sheetName': sheetName },
                    { $push: { 'sheets.$.rows': newRow } },
                );
            });

            // Wait for all rows in the chunk to be processed
            await Promise.all(rowInsertPromises);
        });

        // Wait for all chunk insertions to finish
        await Promise.all(insertPromises);

        // Return success response
        res.status(200).send('Rows inserted successfully.');
    } catch (error) {
        console.error('Error bulk inserting rows:', error);
        res.status(500).send('Error bulk inserting rows.');
    }
};
