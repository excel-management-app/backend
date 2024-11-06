import mongoose from 'mongoose';

// originFileSchema is a schema for the originFile with the following fields:
// - fileName: the name of the file
// - uploadedAt: the date the file was uploaded
// - fileId: the ID of the file, linked to the ExcelFile model
// -s3Path: the path of the file in S3

const originFileSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    s3Path: String,
});

const OriginFile = mongoose.model('OriginFile', originFileSchema);

export default OriginFile;
