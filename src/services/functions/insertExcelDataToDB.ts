import MongoDB from '../../db';
import xlsx from 'xlsx';
import ExcelFile from '../../models/excelFile';

export const insertExcelDataToDB = async (filePath: string): Promise<void> => {
    try {
        const mongoInstance = MongoDB.getInstance();
        await mongoInstance.connect();

        const workbook = xlsx.readFile(filePath);
        const sheetNames = workbook.SheetNames;

        // Khởi tạo danh sách sheets
        const sheets: any[] = [];

        for (let i = 0; i < sheetNames.length; i++) {
            const sheetName = sheetNames[i];
            const worksheet = workbook.Sheets[sheetName];

            // Chuyển sheet thành dạng JSON, header: 1 để nhận cả tiêu đề
            const jsonData: string[][] = xlsx.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: true,
            });

            if (jsonData.length === 0) {
                throw new Error('Excel file is empty or has invalid format');
            }

            // Lấy hàng đầu tiên làm tiêu đề
            const headers = jsonData[0];

            // Tạo dữ liệu cho các hàng, bắt đầu từ hàng thứ 2
            const rows = jsonData.slice(1).map((row) => {
                const rowObject: any = {};

                // Lặp qua từng cell của hàng và khớp với tiêu đề tương ứng
                row.forEach((cell, index) => {
                    const headerName = headers[index];
                    rowObject[headerName] = cell;
                });

                return rowObject;
            });

            // Thêm sheet vào mảng sheets
            sheets.push({ sheetName, headers, rows });
        }

        // Step 3: Tạo document MongoDB cho file Excel
        const newExcelFile = new ExcelFile({
            fileName: getFileName(filePath), // Lấy tên file từ đường dẫn
            sheets,
        });

        // Step 4: Lưu vào MongoDB
        await newExcelFile.save();

        console.log('File Excel đã được chèn vào MongoDB thành công.');
    } catch (error) {
        console.error('Lỗi khi chèn dữ liệu Excel vào MongoDB:', error);
        throw error;
    }
};

function getFileName(filePath: string): string {
    // Split by path separator and get the last part (the filename)
    const parts = filePath.split('\\'); // For Windows paths
    return parts[parts.length - 1];
}
