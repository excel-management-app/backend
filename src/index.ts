import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'

// load .env
dotenv.config()

const app = express()

// use morgan
app.use(morgan('combined'))

const PORT = process.env.PORT || 3001

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
