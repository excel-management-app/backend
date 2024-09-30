import { Request, Response } from "express";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export const uploadFileService = (req: Request, res: Response) => {
    const file = req.file;
    console.log("file====", file)
    if (!file) {
        return { message: 'Chưa upload file nào' };
    }

    return { message: 'Tải lên file thành công', filePath: `/public/${file.filename}` };
};