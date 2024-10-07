import { Request } from 'express';

export function getClientIp(req: Request) {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded
        ? forwarded.split(',').pop()
        : req.connection.remoteAddress;

    // Handle local development IP address "::1" (IPv6 loopback)
    if (ip === '::1') {
        return '127.0.0.1';
    }

    return ip;
}
