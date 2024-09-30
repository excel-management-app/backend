import express ,{Request,Response}from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import helmet from "helmet";
import compression from 'compression'
import {appRouter} from './routes/index'

// load .env
dotenv.config()

const app = express()

// use morgan
app.use(morgan('combined'))
// use compression
app.use(compression());

// security
app.use(helmet());

// routes
app.use( appRouter);

const PORT = process.env.PORT || 3001

app.get('/', (req:Request,res:Response) => {
    res.send('Hello World!')
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
