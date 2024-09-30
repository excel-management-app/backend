import { Request, Response } from "express";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export const readFileService = () => {
    const filePath = `src/public/Copy of XUATDON1.xls`
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[1];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet,{ header: 1 });
    return data
}