import mongoose from 'mongoose';

const originFileSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    fileName: { type: String, required: true },
    sheetNames: { type: Array, required: true },
    uploadedAt: { type: Date, default: Date.now },
    // Reference to the GridFS file
    gridFSId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
        comment: 'Reference to the GridFS file',
    },
});

const OriginFile = mongoose.model('OriginFile', originFileSchema);

export default OriginFile;
