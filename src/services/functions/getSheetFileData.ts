import ExcelFile from '../../models/excelFile';

interface Props {
    fileId: string;
    sheetName: string;
}

export async function getSheetFileData({ fileId, sheetName }: Props) {
    return await ExcelFile.find({
        originFileId: fileId,
        sheets: { $elemMatch: { sheetName } },
    }).lean();
}
