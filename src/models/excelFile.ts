import mongoose from 'mongoose';

const sheetSchema = new mongoose.Schema({
    sheetName: String,
    headers: [String],
    rows: [
        {
            type: Map,
            of: new mongoose.Schema({
                value: String,
                accountId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Account',
                },
            }),
        },
    ],
});

const excelFileSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    sheets: [sheetSchema],
    fileId: mongoose.Schema.Types.ObjectId,
});

// Ensure index creation
excelFileSchema.index({ fileId: 1 });

const ExcelFile = mongoose.model('ExcelFile', excelFileSchema);

export default ExcelFile;
