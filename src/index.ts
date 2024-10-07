import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import MongoDB from './db/index';
import Device from './models/device';
import { appRouter } from './routes/index';
import { getClientIp } from './utils/getClientIp';

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
app.use(
    cors({
        origin: 'http://localhost:3000',
        credentials: true,
    }),
);
//cookie
app.use(cookieParser());
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 365; // 1 year

app.use(async (req, res, next) => {
    try {
        const deviceId = req.cookies.deviceId
            ? String(req.cookies.deviceId)
            : '';

        const ipAddress = getClientIp(req);

        if (!deviceId) {
            const newDevice = new Device({
                ip: ipAddress,
            });
            await newDevice.save();
            res.cookie('deviceId', newDevice._id.toString(), {
                maxAge: COOKIE_MAX_AGE,
                httpOnly: true,
            });
        } else {
            const device = await Device.findById(deviceId);
            if (device) {
                res.cookie('deviceId', device._id, {
                    maxAge: COOKIE_MAX_AGE,
                    httpOnly: true,
                });
            } else {
                const newDevice = new Device({
                    ip: ipAddress,
                });
                await newDevice.save();
                res.cookie('deviceId', newDevice._id, {
                    maxAge: COOKIE_MAX_AGE,
                    httpOnly: true,
                });
            }
        }

        next();
    } catch (error) {
        console.error('Error processing device:', error);
        res.status(500).send('Server error');
    }
});
// routes
app.use(appRouter);

const PORT = process.env.PORT || 3001;

// MongoDB connection
async function connectToMongoDB() {
    await MongoDB.getInstance().connect();
}

app.get('/', async (req, res) => {
    const deviceId = req.cookies.deviceId;

    const device = await Device.findById(deviceId);

    if (device) {
        res.send(
            `Hello! Your device ID is ${deviceId} and your IP is ${device.ip}`,
        );
    } else {
        res.send('Device not found.');
    }
});

app.listen(PORT, () => {
    connectToMongoDB().catch((err) =>
        console.error('Error connecting to MongoDB:', err),
    );

    console.log(`Server is running on port ${PORT}`);
});
