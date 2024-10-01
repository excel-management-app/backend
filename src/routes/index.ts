import { Router } from 'express'
import { readFileRoute } from './read.route'
import { fileRoute } from './file.route'

export const appRouter = Router()

appRouter.use('/read', readFileRoute)

appRouter.use('/file', fileRoute)
