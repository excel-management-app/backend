import mongoose from 'mongoose'

const sheetSchema = new mongoose.Schema({
    sheetName: String,
    headers: [String],
    rows: [
        {
            type: Map,
            of: String
        }
    ]
})

const excelFileSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    sheets: [sheetSchema]
})

const ExcelFile = mongoose.model('ExcelFile', excelFileSchema)

export default ExcelFile
