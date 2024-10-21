import MongoDB from '../../db';
import { GridFSBucket, ObjectId } from 'mongodb';
import xlsx from 'xlsx';
import ExcelFile from '../../models/excelFile';
import { compact } from 'lodash';
import fs from 'fs';
import stream from 'stream';
import { chunk } from 'lodash';

// Adjust these constants based on your needs 1MB
const CHUNK_SIZE = 1024 * 1024;
const BATCH_SIZE = 3000; // Adjust based on your needs

export const insertExcelDataToDB = async (filePath: string): Promise<void> => {
    const mongoInstance = MongoDB.getInstance();
    const db = (await mongoInstance.connect()).db;
    if (!db) {
        throw new Error('Failed to connect to the database');
    }
    const bucket = new GridFSBucket(db, {
        bucketName: 'excelFiles',
        chunkSizeBytes: CHUNK_SIZE,
    });

    try {
        // Upload file to GridFS
        const fileId = await uploadToGridFS(bucket, filePath);

        // Process the uploaded file
        await processExcelFile(bucket, fileId, filePath);

        console.log(`Successfully processed ${filePath}`);
    } catch (error) {
        console.error('Error processing Excel file:', error);
        throw error;
    }
};

async function uploadToGridFS(
    bucket: GridFSBucket,
    filePath: string,
): Promise<ObjectId> {
    return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(getFileName(filePath));
        const fileStream = fs.createReadStream(filePath);

        fileStream
            .pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => resolve(uploadStream.id));
    });
}

async function processExcelFile(
    bucket: GridFSBucket,
    fileId: ObjectId,
    originalFilePath: string,
): Promise<void> {
    const downloadStream = bucket.openDownloadStream(fileId);
    const bufferStream = new stream.PassThrough();
    downloadStream.pipe(bufferStream);

    const workbook = await new Promise<xlsx.WorkBook>((resolve, reject) => {
        const buffers: Buffer[] = [];
        bufferStream.on('data', (chunk) => buffers.push(chunk));
        bufferStream.on('end', () => {
            const buffer = Buffer.concat(buffers);
            try {
                const wb = xlsx.read(buffer, { type: 'buffer' });
                resolve(wb);
            } catch (error) {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(error);
            }
        });
        bufferStream.on('error', reject);
    });

    const fileName = getFileName(originalFilePath);
    let totalRowsInserted = 0;

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
        });

        if (jsonData.length === 0) {
            // console.warn(
            //     `Sheet "${sheetName}" is empty or has invalid format. Skipping.`,
            // );
            continue;
        }

        const headers = jsonData[0];

        const batches = chunk(jsonData.slice(1), BATCH_SIZE);

        for (const batch of batches) {
            const batchRows = batch
                .filter((row) => row.some((cell) => cell !== ''))
                .map((row) => {
                    const rowObject: any = {};
                    headers.forEach((header, index) => {
                        rowObject[header] = row[index];
                    });
                    // insert tamY to rowObject if it is not exist
                    rowObject.tamY = `${rowObject.soHieuToBanDo}_${rowObject.soThuTuThua}`;
                    return rowObject;
                });

            if (batchRows.length > 0) {
                const batchExcelFile = new ExcelFile({
                    fileName,
                    gridFSId: fileId,
                    sheets: [
                        {
                            sheetName,
                            headers,
                            rows: batchRows,
                        },
                    ],
                    fileId: fileId,
                });

                await batchExcelFile.save();
                totalRowsInserted += batchRows.length;
                console.log(
                    `Inserted batch of ${batchRows.length} rows from sheet "${sheetName}"`,
                );
            }
        }
    }

    if (totalRowsInserted === 0) {
        throw new Error('No valid data found in the Excel file');
    }

    // console.log(
    //     `Successfully imported ${totalRowsInserted} rows from ${originalFilePath}`,
    // );
}

function getFileName(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    const fileNameWithPrefix = parts[parts.length - 1];
    return fileNameWithPrefix.replace(/^\d+-/, '');
}
