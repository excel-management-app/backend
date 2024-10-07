import mongoose from 'mongoose';

const sheetSchema = new mongoose.Schema({
    sheetName: String,
    headers: [String],
    rows: [
        {
            type: Map,
            of: new mongoose.Schema({
                value: String,
                deviceId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Device',
                },
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
