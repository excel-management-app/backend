import fs from 'fs';
import xlsx from 'xlsx';
import ExcelFile from '../../models/excelFile';
import OriginFile from '../../models/originFile';

const BATCH_SIZE = 3000; // Adjust based on your needs

export const insertExcelDataToDBV2 = async (
    filePath: string,
): Promise<void> => {
    const file = fs.readFileSync(filePath);
    const workbook = xlsx.read(file, { type: 'buffer', dense: true });
    const fileName = getFileName(filePath);
    const sheetNames = workbook.SheetNames;

    const newOriginFile = await OriginFile.create({
        fileName,
        sheetNames,
    });

    for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
        });

        if (jsonData.length === 0) {
            continue;
        }

        const sheetHeaders = jsonData[0];
        const headers = sheetHeaders.map(
            (header, index) => header || jsonData[2][index],
        );

        const sheetRows: any[] = [];

        for (let i = 1; i < jsonData.length; i += BATCH_SIZE) {
            const batch = jsonData
                .slice(i, i + BATCH_SIZE)
                .filter((row) => row.some((cell) => cell !== ''));

            const batchRows = batch.map((row) => {
                const rowObject: any = {};
                headers.forEach((header, index) => {
                    rowObject[header] = row[index];
                });
                rowObject.tamY = `${rowObject.soHieuToBanDo}_${rowObject.soThuTuThua}`;
                return rowObject;
            });

            sheetRows.push(...batchRows);

            if (
                sheetRows.length >= BATCH_SIZE ||
                i + BATCH_SIZE >= jsonData.length
            ) {
                const excelFile = new ExcelFile({
                    fileName,
                    originFileId: newOriginFile._id,
                    sheets: [
                        {
                            sheetName,
                            headers,
                            rows: sheetRows,
                        },
                    ],
                });

                await excelFile.save();

                sheetRows.length = 0; // Clear batch to manage memory
            }
        }
    }
};

function getFileName(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    const fileNameWithPrefix = parts[parts.length - 1];
    return fileNameWithPrefix.replace(/^\d+-/, '');
}
