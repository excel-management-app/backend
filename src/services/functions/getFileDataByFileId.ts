import ExcelFile from '../../models/excelFile';
import { getGridFsFileById } from './getGridFsFile';

export async function getFileDataByFileId(fileId: string) {
    const gridFsFile = await getGridFsFileById(fileId);
    return await ExcelFile.find({ gridFSId: gridFsFile._id }).lean();
}
