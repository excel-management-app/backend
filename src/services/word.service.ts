import { Request, Response } from 'express';
import {} from 'lodash';
import ExcelFile from '../models/excelFile';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { formatDate } from './functions/formatDate';
import { LocalStorage } from 'node-localstorage';

// Create a new LocalStorage instance
const localStorage = new LocalStorage('./scratch');

// In dữ liệu từ 1 row ra word
export const exportDataToword = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { fileId, sheetName, rowIndex: rowIndexString } = req.params;
    const rowIndex = parseInt(rowIndexString);
    const cookieDevice = req.cookies.deviceCookie;

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

    if (rowIndex < 0 || rowIndex >= sheet.rows.length) {
        res.status(400).send('Invalid row index.');
        return;
    }
    const content = fs.readFileSync(
        path.resolve(__dirname, '../uploads/fileTest.docx'),
        'binary',
    );

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);

    const dataDB = sheet.rows[rowIndex];
    const dataToWord = dataDB.toJSON();
    doc.setData(dataToWord);

    try {
        doc.render();
    } catch (error: any) {
        res.status(500).send('Error generate data to Word' + error.message);
    }

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(path.resolve(__dirname, '../uploads/output.docx'), buf);

    // get data localstorage
    var statistic = localStorage.getItem('statistic');
    let today = new Date();
    var keyDate = formatDate(today); // lấy ra ngày hôm nay định dạng dd/mm/yyyy
    if (!statistic) {
        let obj: { [key: string]: { [key: string]: number } } = {}; // khai báo định dạng obj

        var keyDevice = cookieDevice; // nếu file trống lần đầu thì thêm data ban đầu
        obj[keyDate] = {
            [keyDevice]: 1,
        };
        statistic = JSON.stringify(obj);
    } else {
        var dataObj = JSON.parse(statistic); //parse data ra object
        if (keyDate in dataObj) {
            // kiểm tra đã có dữ liệu ngày hôm nay chưa
            var dataDate = dataObj[keyDate];
            if (cookieDevice in dataDate) {
                // kiểm tra ngày hôm nay thiết bị đã xuất file nào chưa
                var count = (dataDate[cookieDevice] += 1);
            } else {
                dataDate[cookieDevice] = 1;
            }
        } else {
            dataObj[keyDate] = {
                [cookieDevice]: 1,
            };
        }
        statistic = JSON.stringify(dataObj);
    }
    localStorage.setItem('statistic', statistic); // lưu lại dữ liệu

    res.status(200).json({ message: 'Generate data to word successfully' });
};
