import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import MongoDB from './db/index';
import { appRouter } from './routes/index';
import Account from './models/account';
import bcrypt from 'bcrypt';
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
// Function to initialize admin account
const initAdminAccount = async () => {
    try {
        const adminExists = await Account.findOne({ name: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10); // Hash the password with bcrypt
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

app.listen(PORT, () => {
    connectToMongoDB().catch((err) =>
        console.error('Error connecting to MongoDB:', err),
    );

    console.log(`Server is running on port ${PORT}`);
});
