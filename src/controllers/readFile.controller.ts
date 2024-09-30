import { Request, Response } from 'express'
import { readFileService } from '../services/readFile.service'

export const readFileController = {
    readFile: (req: Request, res: Response) => {
        const sheetName = String(req.query.sheetName)
        const data = readFileService(sheetName)
        res.json({ data })
    }
}
