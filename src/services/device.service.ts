import { Request, Response } from 'express';
import Device from '../models/device';
import { getDeviceIdFromHeader } from './functions/getDeviceIdFromHeader';

export const getDevice = async (req: Request, res: Response) => {
    const deviceId = getDeviceIdFromHeader(req);
    if (!deviceId) {
        res.status(401).send('Unauthorized');
        return;
    }
    const device = await Device.findById(deviceId);

    if (!device) {
        res.status(404).send('Device not found');
        return;
    }

    res.status(200).json({ data: device });
};

export const updateDevice = async (req: Request, res: Response) => {
    const deviceId = getDeviceIdFromHeader(req);
    if (!deviceId) {
        res.status(401).send('Unauthorized');
        return;
    }

    const device = await Device.findByIdAndUpdate(deviceId, req.body.data, {
        new: true,
    });
    res.status(200).json({ data: device });
};

export const createDevice = async (req: Request, res: Response) => {
    const isExist = await Device.findOne({ name: req.body.data.name });
    if (isExist) {
        res.status(400).send('Tên đã được sử dụng trên hệ thống');
        return;
    }
    const device = new Device(req.body.data);
    await device.save();
    res.status(200).json({ data: device });
};

export const getAllDevice = async (req: Request, res: Response) => {
    const deviceId = getDeviceIdFromHeader(req);
    if (!deviceId) {
        res.status(401).send('Unauthorized');
        return;
    }
    const devices = await Device.find();
    res.status(200).json({ data: devices });
};