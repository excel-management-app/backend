import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import MongoDB from './db/index';
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

const PORT = process.env.PORT || 3001;

// MongoDB connection
async function connectToMongoDB() {
    await MongoDB.getInstance().connect();
}

app.listen(PORT, () => {
    connectToMongoDB().catch((err) =>
        console.error('Error connecting to MongoDB:', err),
    );

    console.log(`Server is running on port ${PORT}`);
});
