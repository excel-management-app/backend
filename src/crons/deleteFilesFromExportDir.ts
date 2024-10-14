import fs from 'fs';
import path from 'path';

export const deleteFilesFromExportDir = (folderPath: string) => {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading export directory:', err);
            return;
        }
        if (!files.length) {
            console.log('No files found in export directory');
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${file}`, err);
                } else {
                    console.log(`Deleted file: ${file}`);
                }
            });
        });
    });
};
