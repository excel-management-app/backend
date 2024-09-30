import express from 'express';
import dotenv from 'dotenv';

// load .env
dotenv.config();

const app = express();


const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})