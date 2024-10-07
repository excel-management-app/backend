import { Request } from 'express';

export function getDeviceIdFromHeader(req: Request) {
    return req.headers['device-id'] ? String(req.headers['device-id']) : '';
}
