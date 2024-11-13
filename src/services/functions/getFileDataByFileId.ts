import ExcelFile from '../../models/excelFile';

export async function getFileDataByFileId(fileId: string) {
    return await ExcelFile.find({ gridFSId: fileId }).lean();
}
