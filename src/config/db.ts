import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

const dbURI = process.env.MONGODB_URI || "";
export const connectDB = async () => {
  
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(dbURI);
    console.log(`Database Connected: ${conn.connection.name}`);
  } catch (error) {
    console.log(error);
  }

}

