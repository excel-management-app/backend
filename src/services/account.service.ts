import { Request, Response } from 'express';
import AccountModel from '../models/account';
import bcrypt from 'bcrypt';
import { getAccountIdFromHeader } from './functions/getAccountIdFromHeader';
import Statistic from '../models/statistic';
import Account from '../models/account';

export const createAccount = async (req: Request, res: Response) => {
    try {
        const { name, password } = req.body.data;
        const isExist = await isExistAccount(name);
        if (isExist) {
            res.status(400).send('Tên đã tồn tại, hãy nhập tên khác');
            return;
        }
        const hashPw = await hashPassword(password);
        const newAccount = await AccountModel.create({
            name,
            password: hashPw,
            role: 'user',
            createdDate: new Date(),
        });

        res.status(200).json({
            data: {
                _id: newAccount._id,
                name: newAccount.name,
                role: newAccount.role,
            },
        });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
};

export const getAccount = async (req: Request, res: Response) => {
    try {
        const id = getAccountIdFromHeader(req);

        if (!id) {
            res.status(401).send('Không có quyền ');
            return;
        }
        const account = await AccountModel.findOne({ id });

        res.status(200).json({
            data: {
                _id: account?._id,
                name: account?.name,
                role: account?.role,
            },
        });
    } catch (error) {
        res.status(500).send(error);
    }
};
export const login = async (req: Request, res: Response) => {
    try {
        const { name, password } = req.body.data;
        const account = await AccountModel.findOne({ name });
        if (!account) {
            res.status(404).send('Tài khoản không tồn tại');
            return;
        }

        const checkPw = await bcrypt.compare(password, account.password);
        if (!checkPw) {
            res.status(404).send('Sai mật khẩu');
            return;
        }

        res.status(200).json({
            data: {
                _id: account._id,
                name: account.name,
                role: account.role,
            },
        });
    } catch (error) {
        res.status(500).send(error);
    }
};

export const getAllAccounts = (req: Request, res: Response) => {
    const accountId = getAccountIdFromHeader(req);
    if (!accountId) {
        res.status(401).send('Unauthorized');
        return;
    }
    const date = req.params.date;

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    Statistic.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },
            },
        },
        {
            $lookup: {
                from: 'accounts', // Name of the collection you want to join
                localField: 'accountId', // Field in Statistic schema to match
                foreignField: '_id', // Field in Account schema to match
                as: 'accountInfo', // Name of the output array
            },
        },
        {
            $unwind: '$accountInfo', // Deconstruct the array to get the single object
        },
        {
            $project: {
                _id: 1,
                accountId: 1,
                count: 1,
                createdAt: 1,
                name: '$accountInfo.name', // Directly include the account name
            },
        },
    ])
        .then((result) => {
            res.status(200).json({ data: result });
        })
        .catch((error) => {
            console.error('Error in aggregation:', error);
        });
};

export const updateAccount = async (req: Request, res: Response) => {
    try {
        const accountId = getAccountIdFromHeader(req);
        if (!accountId) {
            res.status(401).send('Không có quyền ');
            return;
        }
        const password = req.body.data.password
            ? await hashPassword(req.body.data.password)
            : undefined;
        const name = req.body.data.name;
        if (!name && !password) {
            res.status(401).send('Không thay đổi giá trị');
            return;
        }

        const account = await Account.findByIdAndUpdate(
            accountId,
            {
                name,
                password,
            },
            {
                new: true,
            },
        );
        res.status(200).json({
            data: {
                _id: account?._id,
                name: account?.name,
                role: account?.role,
            },
        });
    } catch (error) {
        res.status(500).send(error);
    }
};

const hashPassword = async (password: string) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

const isExistAccount = async (name: string) => {
    return await AccountModel.exists({ name });
};
