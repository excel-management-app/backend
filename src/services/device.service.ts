import { Request, Response } from 'express';
import { getDeviceIdFromCookies } from './functions/getDeviceIdFromCookies';
import Device from '../models/device';

export const getDevice = async (req: Request, res: Response) => {
    const deviceId = getDeviceIdFromCookies(req);

    if (!deviceId) {
        res.status(401).send('Unauthorized');
        return;
    }
    const device = await Device.findById(deviceId);
    res.status(200).json({ data: device });
};

export const updateDevice = async (req: Request, res: Response) => {
    const deviceId = getDeviceIdFromCookies(req);
    if (!deviceId) {
        res.status(401).send('Unauthorized');
        return;
    }
    const device = await Device.findByIdAndUpdate(deviceId, req.body, {
        new: true,
    });
    res.status(200).json({ data: device });
};
