import mongoose from 'mongoose';

const sheetSchema = new mongoose.Schema({
    sheetName: String,
    headers: [String],
    rows: [
        {
            type: Map,
            of: new mongoose.Schema({
                value: String, // Giá trị chính của mỗi phần tử trong Map
                cookieDevice: String, // Thêm trường cookie vào mỗi đối tượng
            }),
        },
    ],
});

const excelFileSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    sheets: [sheetSchema],
});

const ExcelFile = mongoose.model('ExcelFile', excelFileSchema);

export default ExcelFile;
