import { Request, Response } from "express";
import { readFileService } from "../services/readFile.service";



export const readFileController ={
    readFile : (req: Request, res: Response) => {
        const data = readFileService()
        res.json({data})
    }
}

