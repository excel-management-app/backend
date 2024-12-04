import express from 'express';
import {
    createAccount,
    getAccount,
    getAllAccounts,
    login,
    updateAccount,
    logOut,
} from '../services/account.service';
import { checkAdminMiddleware } from '../middlewares/isAdmin';
import { authenticateJWT } from '../middlewares/authenticateJWT';

export const accountRoute = express.Router();

accountRoute.post('/signup', createAccount);
accountRoute.post('/login', login);
accountRoute.post('/logout', authenticateJWT, logOut);

accountRoute.get(
    '/getAll/:date',
    authenticateJWT,
    checkAdminMiddleware,
    getAllAccounts,
);

accountRoute.get('/me', authenticateJWT, getAccount);

accountRoute.put('/', authenticateJWT, updateAccount);
