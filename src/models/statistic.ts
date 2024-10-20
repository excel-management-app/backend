import mongoose from 'mongoose';

const statisticSchema = new mongoose.Schema({
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
    count: { type: Number, required: false, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

const Statistic = mongoose.model('Statistic', statisticSchema);

export default Statistic;
