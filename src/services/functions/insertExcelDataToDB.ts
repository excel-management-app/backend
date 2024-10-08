import MongoDB from '../../db';
import xlsx from 'xlsx';
import ExcelFile from '../../models/excelFile';
import { compact } from 'lodash';

export const insertExcelDataToDB = async (filePath: string): Promise<void> => {
    try {
        const mongoInstance = MongoDB.getInstance();
        await mongoInstance.connect();

        const workbook = xlsx.readFile(filePath);
        const sheetNames = workbook.SheetNames;

        const sheets: any[] = [];

        for (let i = 0; i < sheetNames.length; i++) {
            const sheetName = sheetNames[i];
            const worksheet = workbook.Sheets[sheetName];

            // Chuyển sheet thành dạng JSON, header: 1 để nhận cả tiêu đề
            const jsonData: string[][] = xlsx.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                blankrows: false,
            });

            if (jsonData.length === 0) {
                throw new Error('Excel file is empty or has invalid format');
            }

            // Lấy hàng đầu tiên làm tiêu đề
            const headers = compact(jsonData[0]);

            // Tạo dữ liệu cho các hàng, bắt đầu từ hàng thứ 2
            const filteredRows = jsonData
                .slice(1)
                .filter((row) => Object.values(row).some((v) => v !== ''));

            const rows = filteredRows.map((row) => {
                const rowObject: any = {};

                // Lặp qua từng cell của hàng và khớp với tiêu đề tương ứng
                row.forEach((cell, index) => {
                    const headerName = headers[index];
                    rowObject[headerName] = cell;
                });

                return rowObject;
            });

            sheets.push({ sheetName, headers, rows });
        }

        const newExcelFile = new ExcelFile({
            fileName: getFileName(filePath),
            sheets,
        });

        await newExcelFile.save();
    } catch (error) {
        console.error('Lỗi khi chèn dữ liệu Excel vào MongoDB:', error);
        throw error;
    }
};

function getFileName(filePath: string): string {
    //  Split by both '/' and '\\' to support both Unix and Windows paths
    const parts = filePath.split(/[/\\]/);
    const fileNameWithPrefix = parts[parts.length - 1];
    return fileNameWithPrefix.replace(/^\d+-/, '');
}
