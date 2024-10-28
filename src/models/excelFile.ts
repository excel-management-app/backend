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
    fileId: mongoose.Schema.Types.ObjectId,
});

const excelFileSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    sheets: [sheetSchema],
    gridFSId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
    },
});

// Ensure index creation
excelFileSchema.index({ gridFSId: 1 });

const ExcelFile = mongoose.model('ExcelFile', excelFileSchema);

export default ExcelFile;
