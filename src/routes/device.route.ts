import express from 'express';
import { getDevice, updateDevice } from '../services/device.service';

export const deviceRoute = express.Router();

deviceRoute.get('/', getDevice);

deviceRoute.put('/', updateDevice);
