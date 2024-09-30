import { Request, Response } from "express";
import { uploadFileService } from "../services/uploadFile.service";

export const uploadFileController ={
    uploadFile : (req: Request, res: Response) => {
        const data = uploadFileService(req, res)
        res.json({data})
    }
}