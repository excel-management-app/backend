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

const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(
    express.json({
        limit: '20mb',
    }),
);

if (!isProduction) {
    // use morgan
    app.use(morgan('combined'));
}
// use compression
app.use(compression());

// security
app.use(helmet());

// Apply CORS middleware
app.use(
    cors({
        origin: 'http://ec2-13-213-0-177.ap-southeast-1.compute.amazonaws.com', // URL frontend
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
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
const EXPORT_DIR = path.join(__dirname, 'files/exports');

cron.schedule('*/15 * * * *', () => {
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

app.get('/', (req, res) => {
    res.send('Hello World');
});
app.listen(PORT, () => {
    connectToMongoDB().catch((err) =>
        console.error('Error connecting to MongoDB:', err),
    );

    console.log(`Server is running on port ${PORT}`);
});
