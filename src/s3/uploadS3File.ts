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
}: Dependencies): Promise<{
    result: PutObjectCommandOutput;
    fileUrl: string;
}> => {
    const s3Client = getS3V3Client(cache);

    const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: s3Path,
        Body: body,
    });

    const result = await s3Client.send(putObjectCommand);

    // Construct the file URL
    const fileUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;

    return { result, fileUrl };
};
