import express from 'express';
import { createAccount, findAccount } from '../services/account.service';

export const accountRoute = express.Router();

accountRoute.post('/', createAccount);

accountRoute.get('/', findAccount);
