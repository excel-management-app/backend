import express ,{Request,Response}from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import {appRouter} from './routes/index'

// load .env
dotenv.config()

const app = express()

// routes
app.use( appRouter);

// use morgan
app.use(morgan('combined'))

const PORT = process.env.PORT || 3001

app.get('/', (req:Request,res:Response) => {
    res.send('Hello World!')
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
