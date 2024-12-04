import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../services/account.service';
import { AuthenticatedRequest } from '../services/types';

export const blacklistedTokens: Set<string> = new Set();

// Function to add a token to the blacklist
export const addTokenToBlacklist = (token: string) => {
    blacklistedTokens.add(token);
};

export const authenticateJWT = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).send('Unauthorized');
            throw new Error('Unauthorized');
        }

        if (blacklistedTokens.has(token)) {
            res.status(403).send('Forbidden');
            return;
        }

        jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
            if (err) {
                res.status(403).send('Forbidden');
                return;
            }

            (req as AuthenticatedRequest).user = user;
            next();
        });
    } catch (error) {
        next(error);
    }
};
