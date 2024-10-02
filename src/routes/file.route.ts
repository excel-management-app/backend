import express from 'express'
import multer from 'multer'
import { uploadExcelFile } from '../services/excel.service'
import path from 'path'
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, 'src/uploads')
    },
    filename: function (_req, file, cb) {
        const ext = path.extname(file.originalname)

        cb(null, file.originalname + '-' + Date.now() + ext)
    }
})

const upload = multer({ storage })

export const fileRoute = express.Router()

fileRoute.post('/upload', upload.single('file'), uploadExcelFile)
