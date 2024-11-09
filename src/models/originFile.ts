import mongoose from 'mongoose';

const originFileSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    fileName: { type: String, required: true },
    sheetNames: { type: Array, required: true },
    uploadedAt: { type: Date, default: Date.now },
});

const OriginFile = mongoose.model('OriginFile', originFileSchema);

export default OriginFile;
