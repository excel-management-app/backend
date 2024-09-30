import { Request, Response } from "express";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {configModel} from "../models/configModel";
import mongoose from "mongoose";



export const readFileService = async () => {
    const filePath = `src/public/file-1727705553293.xls`
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[4];
    // console.log("sheetName", sheetName)
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet,{ header: 1 });

    var obj = {
        [sheetName]: data
    }
    try {
        const newConfig = new configModel({
            data: obj,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        await configModel.create(newConfig);
        console.log('Dữ liệu đã được lưu thành công!');
    } catch (error) {
        console.error('Lỗi khi lưu dữ liệu:', error);
    }

    return data
}
