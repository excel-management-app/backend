import { Request } from 'express';

export function getAccountIdFromHeader(req: Request) {
    return req.headers['account-id'] ? String(req.headers['account-id']) : '';
}
