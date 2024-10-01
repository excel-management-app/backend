import MongoDB from '../db'
import xlsx from 'xlsx'
import { Request, Response } from 'express'
import mongoose from 'mongoose'

export const uploadExcelFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).send('No file uploaded.')
            return
        }

        const filePath = req.file.path

        // Insert the Excel file into the database
        await insertExcelDataToDB(filePath)

        res.status(200).send('File successfully processed and data inserted.')
    } catch (error) {
        console.error('Error processing the file:', error)
        res.status(500).send('Failed to process the file.')
    }
}

export const insertExcelDataToDB = async (filePath: string): Promise<void> => {
    try {
        // Step 1: Establish MongoDB connection
        const mongoInstance = MongoDB.getInstance()
        await mongoInstance.connect()

        // Step 2: Read and parse the Excel file
        const workbook = xlsx.readFile(filePath)
        const sheetNames = workbook.SheetNames
        for (let i = 0; i < sheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i]

            const worksheet = workbook.Sheets[sheetName]
            const jsonData: string[] = xlsx.utils.sheet_to_json(worksheet, {
                defval: null
            })

            if (jsonData.length === 0) {
                throw new Error('Excel file is empty or has invalid format')
            }
            // Step 3: Infer schema from  row of the Excel data
            const row = jsonData[1]
            const dynamicSchema: any = {}

            Object.keys(row).forEach((key) => {
                dynamicSchema[key] = { type: mongoose.Schema.Types.Mixed } // Use Mixed type to allow any kind of value
            })

            // Step 4: Create a dynamic Mongoose schema and model
            const DynamicModel = mongoose.model(
                sheetName,
                new mongoose.Schema(dynamicSchema),
                sheetName
            )
            // Step 5: Insert data into MongoDB using the dynamically created model
            await DynamicModel.insertMany(jsonData.slice(1))
        }
    } catch (error) {
        console.error('Error inserting Excel data into MongoDB:', error)
        throw error
    }
}
