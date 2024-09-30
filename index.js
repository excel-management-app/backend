import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors  from 'cors';
import routes from './routes/adminRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url'; 

// load .env
dotenv.config();

const app = express();
const corsOptions = {
    origin: '*', // Cho phép tất cả các nguồn
    methods: ['GET', 'POST'], // Cho phép các phương thức cụ thể
    allowedHeaders: ['Content-Type'], // Cho phép các header cụ thể
};
  
app.use(cors(corsOptions));



app.use('/', routes);
// use morgan
app.use(morgan('combined'));

const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/public', express.static(path.join(__dirname, 'public')));

// app.get('/', (req, res) => {
//     res.send('Hello World!');
// })
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})