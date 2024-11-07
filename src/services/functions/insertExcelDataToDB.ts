import MongoDB from '../../db';
import { GridFSBucket, ObjectId } from 'mongodb';
import xlsx from 'xlsx';
import ExcelFile from '../../models/excelFile';
import fs from 'fs';
import stream from 'stream';
import { chunk } from 'lodash';

const BATCH_SIZE = 3000; // Adjust based on your needs

export const insertExcelDataToDB = async (filePath: string): Promise<void> => {
    const mongoInstance = MongoDB.getInstance();
    const db = (await mongoInstance.connect()).db;
    if (!db) {
        throw new Error('Failed to connect to the database');
    }
    const bucket = new GridFSBucket(db, {
        bucketName: 'excelFiles',
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
    const buffer = await bufferStreamToBuffer(downloadStream);
    
    const workbook = xlsx.read(buffer, { type: 'buffer', dense: true });
    const fileName = getFileName(originalFilePath);
    let totalRowsInserted = 0;

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
        });

        if (jsonData.length === 0) continue;

        const sheetHeaders = jsonData[0];
        const headers = sheetHeaders.map((header, index) => header || jsonData[2][index]);

        const sheetRows: any[] = [];
        let batchCount = 0;

        for (let i = 1; i < jsonData.length; i += BATCH_SIZE) {
            const batch = jsonData.slice(i, i + BATCH_SIZE).filter((row) => row.some((cell) => cell !== ''));

            const batchRows = batch.map((row) => {
                const rowObject: any = {};
                headers.forEach((header, index) => {
                    rowObject[header] = row[index];
                });
                rowObject.tamY = `${rowObject.soHieuToBanDo}_${rowObject.soThuTuThua}`;
                return rowObject;
            });

            sheetRows.push(...batchRows);

            if (sheetRows.length >= BATCH_SIZE || i + BATCH_SIZE >= jsonData.length) {
                const excelFile = new ExcelFile({
                    fileName,
                    gridFSId: fileId,
                    sheets: [
                        {
                            sheetName,
                            headers,
                            rows: sheetRows,
                        },
                    ],
                });

                await excelFile.save();
                totalRowsInserted += sheetRows.length;
                console.log(`Inserted batch of ${sheetRows.length} rows from sheet "${sheetName}"`);
                
                sheetRows.length = 0;  // Clear batch to manage memory
                batchCount++;
            }
        }
    }

    if (totalRowsInserted === 0) {
        throw new Error('No valid data found in the Excel file');
    }
}

async function bufferStreamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
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
