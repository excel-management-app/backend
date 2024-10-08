import express from 'express';
import {
    createDevice,
    getDevice,
    updateDevice,
} from '../services/device.service';

export const deviceRoute = express.Router();

deviceRoute.post('/', createDevice);

deviceRoute.get('/', getDevice);

deviceRoute.put('/', updateDevice);
