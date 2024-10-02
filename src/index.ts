import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser'
import compression from 'compression';
import cors from 'cors';
import { appRouter } from './routes/index';
import MongoDB from './db/index';

// load .env
dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(
    express.json({
        limit: '10mb',
    }),
);

//cookie
app.use(cookieParser());
app.use((req, res, next) => {
    if (!req.cookies.deviceCookie) {
        // Nếu cookie chưa tồn tại, tạo một cookie mới
        const deviceId = 'device-' + Math.random().toString(36);

        // Thiết lập cookie với thời hạn 1 năm
        res.cookie('deviceCookie', deviceId, {
            maxAge: 365 * 24 * 60 * 60 * 1000, // gia hạn 1 năm cookie
            httpOnly: true, // Cookie chỉ có thể được truy cập bởi máy chủ
            sameSite: 'strict' // Cookie chỉ được gửi từ cùng trang web
        });
    }
    next();
});


// use morgan
app.use(morgan('combined'));
// use compression
app.use(compression());

// security
app.use(helmet());
app.use(cors());

// routes
app.use(appRouter);

const PORT = process.env.PORT || 3001;

// MongoDB connection
async function connectToMongoDB() {
    await MongoDB.getInstance().connect();
}

app.get('/', (_req: Request, res: Response) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    connectToMongoDB().catch((err) =>
        console.error('Error connecting to MongoDB:', err),
    );

    console.log(`Server is running on port ${PORT}`);
});
