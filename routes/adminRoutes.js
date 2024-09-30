import { Router } from 'express'; // Import Router from express using ES Modules
import multer from 'multer';
import path from 'path';

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public')
    },
    filename: function (req, file, cb) {
        // Lấy phần mở rộng của file
        const ext = path.extname(file.originalname);
        // Đặt tên file với phần mở rộng
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
})
  
  // Khởi tạo multer với cấu hình đã tạo
const upload = multer({ storage });

// Route upload file
router.post('/uploadFile', upload.single('file'), (req, res) => {
    try {
        const file = req.file
        console.log("file=====",file)
        if (!file) {
            return res.status(400).json({ message: 'Chưa upload file nào'});
        }
        return res.status(200).json({ message: 'Tải lên file thành công', filePath: `/public/${file.filename}`});
    } catch (error) {
        return res.status(400).send({ message: 'Lỗi upload file' });
    }
    
});
router.get('/', (req, res) => {
    res.send('Welcome to the admin!');
});


export default router;