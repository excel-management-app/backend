import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import OriginFile from '../../models/originFile';

/**
 * Get JSON data from a file by fileId and sheetName.
 */
const CACHE_DIR = path.join(__dirname, '../../cache');
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}
export async function getJsonFileDataByFileId(
    fileId: string,
    sheetName: string,
) {
    const cacheFilePath = path.join(CACHE_DIR, `${fileId}_${sheetName}.json`);

    // Check if the data is already cached
    if (fs.existsSync(cacheFilePath)) {
        const cachedData = fs.readFileSync(cacheFilePath, 'utf-8');
        return JSON.parse(cachedData);
    }

    const originFile = await OriginFile.findById(fileId);

    if (!originFile || !originFile.path) {
        throw new Error('File not found.');
    }
    const file = fs.readFileSync(originFile.path);
    const wb = xlsx.read(file, { type: 'buffer' });
    const worksheet = wb.Sheets[sheetName];

    const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false,
    });

    if (jsonData.length === 0) {
        throw new Error('Sheet not found.');
    }
    // Cache the data
    fs.writeFileSync(cacheFilePath, JSON.stringify(jsonData));

    return jsonData;
}
