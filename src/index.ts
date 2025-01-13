import bcrypt from 'bcrypt';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cron from 'node-cron';
import { deleteFilesFromExportDir } from './crons/deleteFilesFromExportDir';
import MongoDB from './db/index';
import Account from './models/account';
import { appRouter } from './routes/index';
import { EXPORTS_PATH } from 'storages/consts';
// load .env
dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(
    express.json({
        limit: '20mb',
    }),
);

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
// Schedule a cron job to run every 15 minutes

cron.schedule('*/15 * * * *', () => {
    deleteFilesFromExportDir(EXPORTS_PATH);
});

app.listen(PORT, () => {
    connectToMongoDB().catch((err) =>
        console.error('Error connecting to MongoDB:', err),
    );

    console.log(`Server is running on port ${PORT}`);
});
