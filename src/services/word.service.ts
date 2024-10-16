import archiver from 'archiver';
import Docxtemplater from 'docxtemplater';
import { Request, Response } from 'express';
import fs from 'fs';
import {} from 'lodash';
import { LocalStorage } from 'node-localstorage';
import { LOAI_DAT } from "../utils/formFields";
import path from 'path';
import PizZip from 'pizzip';
import ExcelFile from '../models/excelFile';
import Statistic from '../models/statistic';
import { OUTPUT_FILE_PATH } from './functions/exportExcelDataFromDB';
import { getAccountIdFromHeader } from './functions/getAccountIdFromHeader';

global.localStorage = new LocalStorage('./scratch');

function getLandDescription(code: string) {
    const description = LOAI_DAT[code.toUpperCase()];
    return description ? description : "";
  }

// In dữ liệu từ 1 row ra word
export const exportManytoWord = async (
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

            const accountId = getAccountIdFromHeader(req);
            const statistic = await Statistic.find({
                accountId,
                createdAt: { $gte: startOfDay, $lte: endOfDay },
            });
            console.log("statistic=====",statistic);
            if (statistic.length > 0) {
                await Statistic.findByIdAndUpdate(
                    statistic[0]._id,
                    { count: statistic[0]?.count + lstData.length },
                    {
                        new: true,
                    },
                );
            } else {
                console.log("accountId=====",accountId);
                await Statistic.create({
                    accountId,
                    count: lstData.length,
                    createdAt: now,
                });
            }

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
            const dataDB = sheet.rows[index];
            const nameFile = dataDB.get('soHieuToBanDo')+dataDB.get('soThuTuThua');
            const type = dataDB.get('loaiDon');
            const dataToWord = dataDB.toJSON();
            var pathFileTemplate = '';
            // eslint-disable-next-line no-var
            var content: PizZip.LoadData;
            try {
                if(type == "Cấp mới") {
                    pathFileTemplate = global.localStorage.getItem('wordCapMoi') || '';
                } else {
                    pathFileTemplate = global.localStorage.getItem('wordCapDoi') || '';
                }
                
                if (
                    pathFileTemplate == null ||
                    pathFileTemplate == undefined ||
                    pathFileTemplate.trim() == ''
                ) {
                    res.status(404).send('Bạn chưa upload file template word mẫu đơn ' + type == "Cấp mới" ? "cấp mới": "cấp đổi");
                    return;
                }

                content = fs.readFileSync(
                    path.resolve(__dirname, `../../${pathFileTemplate}`),
                    'binary',
                );
            } catch (error: any) {
                res.status(404).send('Bạn chưa upload file template word.');
                return;
            }
            
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                nullGetter: (part) => {
                    console.warn(
                        `Không tìm thấy dữ liệu cho placeholder: ${part.value}`,
                    );
                    return ''; // Trả về chuỗi rỗng nếu không tìm thấy dữ liệu
                },
            });

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
            const fileName = `${type}-${nameFile}-${timestamp}.docx`;
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


export const exportOneToWord = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { fileId, sheetName, rowIndex: rowIndexString } = req.params;
    const rowIndex = parseInt(rowIndexString);

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

        if (rowIndex < 0 || rowIndex >= sheet.rows.length) {
            res.status(400).send('Invalid row index.');
            return;
        }
        const timestamp = new Date().getTime();
        const dataExport = sheet.rows[rowIndex];

        const nameFile = dataExport.get('soHieuToBanDo')+dataExport.get('soThuTuThua');
            const type = dataExport.get('loaiDon');
            const loaiDat1: string = dataExport.get('loaiDat1'); 
            console.log("loaiDat1========",loaiDat1 )


            dataExport.set('loaiDat1', getLandDescription(loaiDat1) );

            const loaiDat2 = dataExport.get('loaiDat2'); 
            dataExport.set('loaiDat2', getLandDescription(loaiDat2));

            const loaiDatCu1 = dataExport.get('loaiDatCu1'); 
            dataExport.set('loaiDatCu1', getLandDescription(loaiDatCu1));

            const loaiDatCu2 = dataExport.get('loaiDatCu2'); 
            dataExport.set('loaiDatCu2', getLandDescription(loaiDatCu2));

            const dataToWord = dataExport.toJSON();
            var pathFileTemplate = '';
            // eslint-disable-next-line no-var
            var content: PizZip.LoadData;
            try {
                if(type == "Cấp mới") {
                    pathFileTemplate = global.localStorage.getItem('wordCapMoi') || '';
                } else {
                    pathFileTemplate = global.localStorage.getItem('wordCapDoi') || '';
                }
                
                if (
                    pathFileTemplate == null ||
                    pathFileTemplate == undefined ||
                    pathFileTemplate.trim() == ''
                ) {
                    res.status(404).send('Bạn chưa upload file template word mẫu đơn ' + type == "Cấp mới" ? "cấp mới": "cấp đổi");
                    return;
                }

                content = fs.readFileSync(
                    path.resolve(__dirname, `../../${pathFileTemplate}`),
                    'binary',
                );
            } catch (error: any) {
                res.status(404).send('Bạn chưa upload file template word.');
                return;
            }
            
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                nullGetter: (part) => {
                    console.warn(
                        `Không tìm thấy dữ liệu cho placeholder: ${part.value}`,
                    );
                    return ''; // Trả về chuỗi rỗng nếu không tìm thấy dữ liệu
                },
            });

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
            const fileName = `word_file-${rowIndex}.docx`;

            fs.writeFileSync(path.resolve(__dirname,`../files/exports/${fileName}` ), buf);

            res.status(200).send('Tạo file thành công: ');
           

    } catch (error: any) {
        res.status(500).send('Error updating row: ' + error.message);
    }
};