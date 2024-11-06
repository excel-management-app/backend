import { PutObjectCommand, PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { getS3V3Client } from './getS3V3Client';

interface Dependencies {
    s3Path: string;
    body: Buffer;
    cache?: boolean;
}

export const uploadS3File = async ({
    s3Path,
    body,
    cache = true,
}: Dependencies): Promise<PutObjectCommandOutput> => {
    const s3Client = getS3V3Client(cache);

    const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: s3Path,
        Body: body,
    });

    return await s3Client.send(putObjectCommand);
};
