import { Request, Response } from 'express';
import AccountModel from '../models/account';
import bcrypt from 'bcrypt';

export const isExistAccount = async (name: string) => {
    return await AccountModel.exists({ name });
};

export const findAccount = async (name: string) => {
    return await AccountModel.findOne({ name });
};

export const createAccount = async (req: Request, res: Response) => {
    const { name, password } = req.body.data;
    try {
        const newAccount = await AccountModel.create({
            name,
            password,
            createdDate: new Date(),
        });

        res.status(200).json({
            data: {
                _id: newAccount._id,
                name: newAccount.name,
            },
        });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
};

export const updatePassword = async (req: Request, res: Response) => {
    const { name, newPassword } = req.body.data;
    try {
        const hashPw = await hashPassword(newPassword);

        await AccountModel.updateOne({ name }, { password: hashPw });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).send(error);
    }
};

export const getAccount = async (req: Request, res: Response) => {
    const { id } = req.body.data;
    try {
        const account = await AccountModel.findOne({ id });

        res.status(200).json({
            data: {
                _id: account?._id,
                name: account?.name,
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
