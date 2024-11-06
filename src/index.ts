import bcrypt from 'bcrypt';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';
import path from 'path';
import { deleteFilesFromExportDir } from './crons/deleteFilesFromExportDir';
import MongoDB from './db/index';
import Account from './models/account';
import { appRouter } from './routes/index';
// load .env
dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(
    express.json({
        limit: '10mb',
    }),
);

// use morgan
app.use(morgan('combined'));
// use compression
app.use(compression());

// security
app.use(helmet());

// Apply CORS middleware
app.use(
    cors({
        origin: '*',
    }),
);

// routes
app.use(appRouter);

const PORT = parseInt(process.env.PORT || '') || 3001;

// MongoDB connection
const initAdminAccount = async () => {
    try {
        const adminExists = await Account.findOne({ name: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const newAdmin = new Account({
                name: 'admin',
                password: hashedPassword,
                role: 'admin',
            });
            await newAdmin.save();
            console.log('Admin account created');
        } else {
            console.log('Admin account already exists');
        }
    } catch (error) {
        console.error('Error creating admin account:', error);
    }
};
async function connectToMongoDB() {
    await MongoDB.getInstance().connect();
    await initAdminAccount();
}
// Schedule a cron job to run every 5 minutes
const EXPORT_DIR = path.join(__dirname, 'files/exports');
const TEMPLATE_DIR = path.join(__dirname, 'files/templates');
cron.schedule('*/5 * * * *', () => {
    console.log('Running file deletion task...');
    deleteFilesFromExportDir(EXPORT_DIR);
});
// // if no folder src/files/exports, create one for exports
// if (!fs.existsSync(EXPORT_DIR)) {
//     fs.mkdirSync(EXPORT_DIR);
// }
// if (!fs.existsSync(TEMPLATE_DIR)) {
//     fs.mkdirSync(TEMPLATE_DIR);
// }
app.listen(PORT, () => {
    connectToMongoDB().catch((err) =>
        console.error('Error connecting to MongoDB:', err),
    );

    console.log(`Server is running on port ${PORT}`);
});
