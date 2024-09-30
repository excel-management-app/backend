import express from 'express'
import { readFileController } from '../controllers/readFile.controller'

export const readFileRoute = express.Router()

readFileRoute.get('/', (req, res) => {
    return readFileController.readFile(req, res)
})
