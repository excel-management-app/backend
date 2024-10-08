import express from 'express';
import {
    createDevice,
    getDevice,
    getAllDevice,
    updateDevice,
} from '../services/device.service';

export const deviceRoute = express.Router();

deviceRoute.post('/', createDevice);

deviceRoute.get('/', getDevice);

deviceRoute.get('/getAll', getAllDevice);

deviceRoute.put('/', updateDevice);
