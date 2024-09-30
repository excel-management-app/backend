import express from 'express';
import { uploadFileController } from '../controllers/uploadFile.controller';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '../backend/src/public')
    },
    filename: function (req, file, cb) {
        // Lấy phần mở rộng của file
        const ext = path.extname(file.originalname);
        // console.log("path",path)
        // Đặt tên file với phần mở rộng
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
})

const upload = multer({ storage });
export const uploadFileRoute = express.Router();

uploadFileRoute.post('/', upload.single('file'), (req, res) => {
   return uploadFileController.uploadFile(req, res)
})