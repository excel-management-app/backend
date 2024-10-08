import Docxtemplater from 'docxtemplater';
import { Request, Response } from 'express';
import fs from 'fs';
import {} from 'lodash';
import path from 'path';
import PizZip from 'pizzip';
import archiver from 'archiver';
import ExcelFile from '../models/excelFile';
import { OUTPUT_FILE_PATH } from './functions/exportExcelDataFromDB';

// In dữ liệu từ 1 row ra word
export const exportDataToword = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { fileId, sheetName } = req.params;
    const rowIndex = req.body;
    console.log("rowIndex====")
    console.log(rowIndex)
    // const rowIndex = parseInt(rowIndexString);

    const file = await ExcelFile.findById(fileId);
    if (!file) {
        res.status(404).send('File not found.');

        return;
    }

    const sheet = file.sheets.find((s) => s.sheetName === sheetName);
    if (!sheet) {
        res.status(404).send('Sheet not found.');

        return;
    }
     
    if(rowIndex.length < 1) {
        res.status(400).send('No row selected.');
        return;
    }
    if (rowIndex < 0 || rowIndex >= sheet.rows.length) {
        res.status(400).send('Invalid row index.');
        return;
    }
    const content = fs.readFileSync(
        path.resolve(__dirname, '../uploads/fileTest.docx'),
        'binary',
    );

    var lstData= rowIndex.split(",").map(Number)
    let filePaths: string[] = [];

    // lstData.forEach((index: any) => {
    //     console.log("index====",index);
    //     const zip = new PizZip(content);
    //     const doc = new Docxtemplater(zip);
    //     const dataDB = sheet.rows[index];
    //     const dataToWord = dataDB.toJSON();
    //     doc.setData(dataToWord);

    //     try {
    //         doc.render();
    //     } catch (error: any) {
    //         res.status(500).send('Error generate data to Word' + error.message);
    //     }

    //     const buf = doc.getZip().generate({ type: 'nodebuffer' });
    //     const filePath = `${OUTPUT_FILE_PATH}/output${index}.docx`;
    //     fs.writeFileSync(filePath, buf);
        
    //     filePaths.push(filePath);
    //     // res.download(filePath, 'output.docx', (err) => {
    //     //     if (err) {
    //     //         console.error(err);
    //     //         res.status(500).send('Error downloading the file.');
    //     //     }
    //     // });
    // });
    // const zipFileName = 'documents.zip';
    // const zipFilePath = path.join(OUTPUT_FILE_PATH, zipFileName);

    // // Tạo một file zip và gửi về phía client
    // const output = fs.createWriteStream(zipFilePath);
    // const archive = archiver('zip', { zlib: { level: 9 } });

    // output.on('close', () => {
    //     console.log(`Zip file created: ${zipFilePath}`);
    //     res.download(zipFilePath, zipFileName, (err) => {
    //         if (err) {
    //             console.error(err);
    //             res.status(500).send('Error downloading the file.');
    //         }

    //         // Xóa file zip sau khi tải xuống để tiết kiệm không gian lưu trữ
    //         fs.unlinkSync(zipFilePath);
    //     });
    // });

    // archive.on('error', (err) => {
    //     console.error('Error creating the zip file:', err);
    //     res.status(500).send('Error creating the zip file.');
    // });

    // archive.pipe(output);

    // // Thêm các file docx vào archive
    // filePaths.forEach(filePath => {
    //     archive.file(filePath, { name: path.basename(filePath) });
    // });

    // // Kết thúc và nén file
    // archive.finalize();
};
