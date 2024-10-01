import { Request, Response } from "express";
import { createDataService, editDataService, searchDataService } from "../services/handleData.service";

export const handleDataController = {
    createData : async (req: Request, res: Response) => {
        const data = await createDataService(req, res)
        res.json({data})
    },
    editData : async (req: Request, res: Response) => {
        const data = await editDataService(req, res)
        res.json({data})
    },
    searchData : async (req: Request, res: Response) => {
        const data = await searchDataService(req, res)
        res.json({data})
    }
}