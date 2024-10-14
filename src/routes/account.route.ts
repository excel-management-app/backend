import express from 'express';
import {
    createAccount,
    getAccount,
    getAllAccounts,
    login,
    updateAccount,
} from '../services/account.service';

export const accountRoute = express.Router();

accountRoute.post('/signup', createAccount);
accountRoute.post('/login', login);

accountRoute.get('/getAll/:date', getAllAccounts);

accountRoute.put('/', updateAccount);

accountRoute.get('/', getAccount);
