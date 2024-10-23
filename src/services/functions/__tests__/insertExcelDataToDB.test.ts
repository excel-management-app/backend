import { insertExcelDataToDB } from '../insertExcelDataToDB';
import MongoDB from 'db';
import { GridFSBucket, ObjectId } from 'mongodb';
import xlsx from 'xlsx';
import ExcelFile from 'models/excelFile';
import fs from 'fs';
import stream from 'stream';

jest.mock('mongodb');
jest.mock('xlsx');
jest.mock('models/excelFile');
jest.mock('fs');
jest.mock('stream');

describe('insertExcelDataToDB', () => {
    let mockDb: any;
    let mockBucket: any;
    let mockFileId: ObjectId;

    beforeEach(() => {
        mockDb = {
            collection: jest.fn().mockReturnThis(),
            insertOne: jest.fn(),
        };
        mockBucket = {
            openUploadStream: jest.fn().mockReturnThis(),
            openDownloadStream: jest.fn().mockReturnThis(),
            id: new ObjectId(),
        };
        mockFileId = new ObjectId();

        (MongoDB.getInstance as jest.Mock).mockReturnValue({
            connect: jest.fn().mockResolvedValue({ db: mockDb }),
        });
        (GridFSBucket as unknown as jest.Mock).mockImplementation(
            () => mockBucket,
        );
        (fs.createReadStream as jest.Mock).mockReturnValue(
            new stream.PassThrough(),
        );
        (stream.PassThrough as unknown as jest.Mock).mockImplementation(
            () => new stream.PassThrough(),
        );
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should throw an error if database connection fails', async () => {
        (MongoDB.getInstance as jest.Mock).mockReturnValue({
            connect: jest.fn().mockResolvedValue({ db: null }),
        });

        await expect(insertExcelDataToDB('path/to/file.xlsx')).rejects.toThrow(
            'Failed to connect to the database',
        );
    });

    it('should upload file to GridFS and process it', async () => {
        const mockWorkbook = {
            SheetNames: ['Sheet1'],
            Sheets: {
                Sheet1: {},
            },
        };
        (xlsx.read as jest.Mock).mockReturnValue(mockWorkbook);
        (xlsx.utils.sheet_to_json as jest.Mock).mockReturnValue([
            ['header1', 'header2'],
            ['data1', 'data2'],
        ]);

        await insertExcelDataToDB('path/to/file.xlsx');

        expect(mockBucket.openUploadStream).toHaveBeenCalled();
        expect(mockBucket.openDownloadStream).toHaveBeenCalledWith(mockFileId);
        expect(xlsx.read).toHaveBeenCalled();
        expect(ExcelFile.prototype.save).toHaveBeenCalled();
    });

    it('should throw an error if no valid data found in the Excel file', async () => {
        const mockWorkbook = {
            SheetNames: ['Sheet1'],
            Sheets: {
                Sheet1: {},
            },
        };
        (xlsx.read as jest.Mock).mockReturnValue(mockWorkbook);
        (xlsx.utils.sheet_to_json as jest.Mock).mockReturnValue([]);

        await expect(insertExcelDataToDB('path/to/file.xlsx')).rejects.toThrow(
            'No valid data found in the Excel file',
        );
    });

    it('should handle errors during file processing', async () => {
        (fs.createReadStream as jest.Mock).mockImplementation(() => {
            throw new Error('File read error');
        });

        await expect(insertExcelDataToDB('path/to/file.xlsx')).rejects.toThrow(
            'File read error',
        );
    });
});
