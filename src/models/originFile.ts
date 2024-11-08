import mongoose from 'mongoose';

// originFileSchema is a schema for the originFile with the following fields:
// - fileName: the name of the file
// - uploadedAt: the date the file was uploaded
// - fileId: the ID of the file, linked to the ExcelFile model
// -path: the path of the file

const originFileSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    fileName: { type: String, required: true },
    sheetNames: { type: Array, required: true },
    uploadedAt: { type: Date, default: Date.now },
    path: String,
});

const OriginFile = mongoose.model('OriginFile', originFileSchema);

export default OriginFile;
