import { Request, Response } from "express";

export const readFileController ={
    readFile : (req: Request, res: Response) => {
        //
        res.send('readFile')
    }
}