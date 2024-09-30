import { Router } from 'express'
import { readFileRoute } from './read.route'

export const appRouter = Router()

appRouter.use('/read', readFileRoute)
