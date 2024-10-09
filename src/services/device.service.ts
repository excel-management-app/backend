import { Request, Response } from 'express';
import Device from '../models/device';
import { getDeviceIdFromHeader } from './functions/getDeviceIdFromHeader';
import Statistic from '../models/statistic';
import { result } from 'lodash';

export const getDevice = async (req: Request, res: Response) => {
    const deviceId = getDeviceIdFromHeader(req);
    if (!deviceId) {
        res.status(401).send('Unauthorized');
        return;
    }
    const device = await Device.findById(deviceId);
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
    const date = req.params.date;
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    Statistic.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },
            },
        },
        {
            $lookup: {
                from: 'devices', // Name of the collection you want to join
                localField: 'deviceId', // Field in Statistic schema to match
                foreignField: '_id', // Field in Device schema to match
                as: 'deviceInfo', // Name of the output array
            },
        },
        {
            $unwind: '$deviceInfo', // Deconstruct the array to get the single object
        },
        {
            $project: {
                _id: 1,
                deviceId: 1,
                count: 1,
                createdAt: 1,
                name: '$deviceInfo.name', // Directly include the device name
            },
        },
    ])
    .then(result => {
        console.log("----------");
        res.status(200).json({ data: result });
    })
    .catch(error => {
        console.error('Error in aggregation:', error);
    });
    // const devices = await Device.find();
    
};