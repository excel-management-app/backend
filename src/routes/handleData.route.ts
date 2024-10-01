import express from 'express';
import { handleDataController } from '../controllers/handleData.controller';


export const handleDataRoute = express.Router();

handleDataRoute.get('/searchData', (req, res) => {
   return handleDataController.searchData(req, res)
})

handleDataRoute.post('/createData', (req, res) => {
  return handleDataController.createData(req, res)
})

handleDataRoute.post('/editData', (req, res) => {
  return handleDataController.editData(req, res)
})