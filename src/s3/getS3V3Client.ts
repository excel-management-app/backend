import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// AWS S3 client
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

let s3Client: S3Client | undefined;
export const getS3V3Client = (cache = true): S3Client => {
    if (!accessKeyId || !secretAccessKey) {
        throw new Error('AWS credentials are missing');
    }
    if (cache && s3Client) {
        return s3Client;
    }

    s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    return s3Client;
};
