import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export const uploadWordTemplate = (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).send('No file uploaded.');
            return;
        }

        const typeFile = req.body.type;

        const filePath = req.file.path;

        const fileName = getFileName(typeFile);
        if (!fileName) {
            res.status(400).send('Invalid file type.');
            return;
        }

        // rename file to wordCapMoi.docx or wordCapDoi.docx
        fs.renameSync(filePath, path.resolve(filePath, '..', fileName));
        res.status(200).send({
            message: 'File successfully processed and data inserted.',
            filePath: filePath,
        });
    } catch (error) {
        console.error('Error processing the file:', error);
        res.status(500).send('Failed to process the file.');
    }
};

const getFileName = (typeFile: string): string | null => {
    switch (typeFile) {
        case '1':
            return 'wordCapMoi.docx';
        case '2':
            return 'wordCapDoi.docx';
        default:
            return null;
    }
};
