import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from 'services/types';

export const checkAdminMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const role = (req as AuthenticatedRequest).user?.role;
        if (!role) {
            res.status(401).json({ message: 'Unauthorized' });
        }

        if (role !== 'admin') {
            res.status(403).json({ message: 'Access denied: Admins only' });
        }

        next();
    } catch (error) {
        next(error);
    }
};
