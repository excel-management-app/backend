import Account from '../models/account';
import { getAccountIdFromHeader } from '../services/functions/getAccountIdFromHeader';
import { Request, Response, NextFunction } from 'express';

export const checkAdminMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const accountId = getAccountIdFromHeader(req);
        if (!accountId) {
            res.status(401).json({ message: 'Unauthorized' });
        }

        const account = await Account.findById(accountId);
        if (!account) {
            res.status(404).json({ message: 'Account not found' });
            return;
        }

        if (account.role !== 'admin') {
            res.status(403).json({ message: 'Access denied: Admins only' });
        }

        next();
    } catch (error) {
        next(error);
    }
};
