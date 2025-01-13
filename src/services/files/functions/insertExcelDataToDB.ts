import fs from 'fs';
import { GridFSBucket, ObjectId } from 'mongodb';
import xlsx from 'xlsx';
import { chunk } from 'lodash';
import MongoDB from '../../../db';
import OriginFile from '../../../models/originFile';
import { ROW_BATCH_SIZE } from '../../consts';

export const insertExcelDataToDB = async (filePath: string): Promise<void> => {
    const mongoInstance = MongoDB.getInstance();
    const db = (await mongoInstance.connect()).db;
    if (!db) {
        throw new Error('Failed to connect to the database');
    }
    const bucket = new GridFSBucket(db, {
        bucketName: 'excelfiles',
    });

    try {
        // Upload file to GridFS
        const fileId = await uploadToGridFS(bucket, filePath);

        // Process the uploaded file
        await processExcelFile(bucket, fileId, filePath, db);
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
    db: any,
): Promise<void> {
    const downloadStream = bucket.openDownloadStream(fileId);
    const buffer = await bufferStreamToBuffer(downloadStream);

    const workbook = xlsx.read(buffer, { type: 'buffer', dense: true });
    const fileName = getFileName(originalFilePath);
    const sheetNames = workbook.SheetNames;

    await OriginFile.create({
        gridFSId: fileId,
        fileName,
        sheetNames,
    });

    let totalRowsInserted = 0;
    const excelFileCollection = db.collection('excelfiles');

    for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
            raw: true, // raw data nhanh hơn
        });

        if (jsonData.length === 0) {
            continue;
        }

        const headers = jsonData[0].map(
            (header, index) => header || jsonData[2][index],
        );

        // Transform raw data into row objects
        const rowObjects = jsonData
            .slice(1)
            .filter((row) => row.some((cell) => cell !== ''))
            .map((row) => {
                const rowObject: Record<string, any> = {};
                headers.forEach((header, index) => {
                    if (row[index] !== '') {
                        rowObject[header] = row[index];
                    }
                });
                rowObject.tamY = `${rowObject.soHieuToBanDo}_${rowObject.soThuTuThua}`;
                return rowObject;
            });

        // Chunk rows into batches for bulk insert
        const rowChunks = chunk(rowObjects, ROW_BATCH_SIZE);
        for (const rowChunk of rowChunks) {
            const bulkOperator = {
                insertOne: {
                    document: {
                        fileName,
                        gridFSId: fileId,
                        sheets: [
                            {
                                sheetName,
                                headers,
                                rows: rowChunk,
                            },
                        ],
                    },
                },
            };

            await excelFileCollection.bulkWrite([bulkOperator]);
            totalRowsInserted += rowChunk.length;
        }
    }

    if (totalRowsInserted === 0) {
        throw new Error('No valid data found in the Excel file');
    }
}

async function bufferStreamToBuffer(
    stream: NodeJS.ReadableStream,
): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

function getFileName(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    const fileNameWithPrefix = parts[parts.length - 1];
    return fileNameWithPrefix.replace(/^\d+-/, '');
}
