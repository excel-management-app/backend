import mongoose from "mongoose";


const Schema = mongoose.Schema;
const ConfigSchema = new Schema({
  data: {
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export const configModel = mongoose.model('Config', ConfigSchema);