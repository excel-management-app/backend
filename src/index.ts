import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import { appRouter } from './routes/index'

// load .env
dotenv.config()

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(
    express.json({
        limit: '10mb'
    })
)

// use morgan
app.use(morgan('combined'))
// use compression
app.use(compression())

// security
app.use(helmet())
app.use(cors())

// routes
app.use(appRouter)

const PORT = process.env.PORT || 3001

app.get('/', (_req: Request, res: Response) => {
    res.send('Hello World!')
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
