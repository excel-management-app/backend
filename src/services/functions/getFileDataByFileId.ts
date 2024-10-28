import ExcelFile from '../../models/excelFile';
import { getGridFsFileById } from './getGridFsFile';

export async function getFileDataByFileId(fileId: string) {
    const gridFsFile = await getGridFsFileById(fileId);
    return await ExcelFile.find({ gridFSId: gridFsFile._id }).lean();
}

// get row data by fileId, sheetName, tamY
// Path: backend/src/services/functions/getRowDataByFileId.ts

export async function getRowDataByFileId(
    fileId: string,
    sheetName: string,
    tamY: string,
) {
    const gridFsFile = await getGridFsFileById(fileId);
    const row = await ExcelFile.findOne(
        {
            gridFSId: gridFsFile._id,
            'sheets.sheetName': sheetName,
            'sheets.rows.tamY': tamY,
        },
        { 'sheets.$': 1, 'sheets.rows.$': 1 },
    ).lean();
    if (!row) {
        throw new Error('Row not found');
    }
    return row.sheets[0].rows[0];
}
