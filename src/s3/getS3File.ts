import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3V3Client } from 's3/getS3V3Client';
import type { Readable } from 'stream';

export const getS3File = async (s3Path: string): Promise<Buffer> => {
    const s3 = getS3V3Client();
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: s3Path,
    });

    const response = await s3.send(command);
    if (!response.Body) {
        throw new Error(`Failed to get file from S3 with path ${s3Path}`);
    }

    const stream = response.Body as Readable;
    return streamToBuffer(stream);
};

function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}
