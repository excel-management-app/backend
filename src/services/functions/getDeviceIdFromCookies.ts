import { Request } from 'express';

export function getDeviceIdFromCookies(req: Request) {
    return req.cookies.deviceId ? String(req.cookies.deviceId) : '';
}
