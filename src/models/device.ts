import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});

const Device = mongoose.model('Device', deviceSchema);

export default Device;
