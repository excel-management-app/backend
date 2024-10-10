import archiver from 'archiver';
import Docxtemplater from 'docxtemplater';
import { Request, Response } from 'express';
import fs from 'fs';
import {} from 'lodash';
import { LocalStorage } from 'node-localstorage';
import path from 'path';
import PizZip from 'pizzip';
import ExcelFile from '../models/excelFile';
import Statistic from '../models/statistic';
import { OUTPUT_FILE_PATH } from './functions/exportExcelDataFromDB';
import { getDeviceIdFromHeader } from './functions/getDeviceIdFromHeader';

global.localStorage = new LocalStorage('./scratch');

// In dữ liệu từ 1 row ra word
export const exportDataToword = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { fileId, sheetName } = req.params;
    const rowIndex = req.body.data;

    try {
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

        if (rowIndex.length < 1) {
            res.status(400).send('No row selected.');
            return;
        }
        if (rowIndex < 0 || rowIndex >= sheet.rows.length) {
            res.status(400).send('Invalid row index.');
            return;
        }
        var pathFileTemplate = "";
        var content: PizZip.LoadData;
        try {
            pathFileTemplate = global.localStorage.getItem('templateWord') || ""
            if (pathFileTemplate == null || pathFileTemplate == undefined || pathFileTemplate.trim() == "") {
                res.status(404).send('Bạn chưa upload file template word.');
                return;
            }
    
            content = fs.readFileSync(
                path.resolve(__dirname, `../../${pathFileTemplate}`),
                'binary',
            );
        }
        catch(error: any) {
            res.status(404).send('Bạn chưa upload file template word.');
            return;
        }
        
       
        const timestamp = new Date().getTime();
        const zipFileName = `document-${fileId}.zip`;
        const zipFilePath = `${OUTPUT_FILE_PATH}document-${fileId}.zip`; // Đường dẫn để lưu file zip

        const lstData = rowIndex.split(',').map(Number);

        // Tạo stream để ghi dữ liệu vào file zip
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        const filesInZip: string[] = [];

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        output.on('close', async () => {
            const now = new Date();

            // Tạo thời gian bắt đầu của ngày hôm nay (00:00:00)
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));

            // Tạo thời gian kết thúc của ngày hôm nay (23:59:59.999)
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));

            const deviceId = getDeviceIdFromHeader(req);
            const statistic = await Statistic.find({
                deviceId: deviceId,
                createdAt: { $gte: startOfDay, $lte: endOfDay },
            });
            if (statistic.length > 0) {
                await Statistic.findByIdAndUpdate(
                    statistic[0]._id,
                    { count: statistic[0]?.count + lstData.length },
                    {
                        new: true,
                    },
                );
            } else {
                await Statistic.create({
                    deviceId: deviceId,
                    count: lstData.length,
                    createdAt: now,
                });
            }
            // const updated = await Device.findByIdAndUpdate(deviceId, { count: device?.count+lstData.length} , {
            //     new: true,
            // });
            return res.status(200).send(zipFileName);
        });

        archive.on('error', (err) => {
            console.error('Error creating the zip file:', err);
            res.status(500).send('Error creating the zip file.');
        });

        // Kết nối stream của archive với file zip
        archive.pipe(output);

        // Tạo các file .docx và thêm vào file zip
        lstData.forEach((index: number) => {
            // console.log("index====", index);
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                nullGetter: (part) => {
                  console.warn(`Không tìm thấy dữ liệu cho placeholder: ${part.value}`);
                  return ""; // Trả về chuỗi rỗng nếu không tìm thấy dữ liệu
                },
              });
            const dataDB = sheet.rows[index];
            const nameFile = dataDB.get('hoTen');
            const dataToWord = dataDB.toJSON();
            doc.setData(dataToWord);

            try {
                doc.render();
            } catch (error: any) {
                console.error('Error generating data to Word: ', error);
                res.status(500).send(
                    'Error generating data to Word: ' + error.message,
                );
                return; // Dừng lại nếu có lỗi trong quá trình render
            }

            const buf = doc.getZip().generate({ type: 'nodebuffer' });
            const fileName = `${nameFile}-${timestamp}.docx`;
            filesInZip.push(fileName);
            archive.append(buf, { name: fileName }); // Thêm file .docx vào file zip
        });

        // Kết thúc và tạo file zip
        archive.finalize();
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exporting file');
    }
};
