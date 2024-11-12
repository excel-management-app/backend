/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/no-unused-collection */
/* eslint-disable @typescript-eslint/no-floating-promises */
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
import { LOAI_DAT } from '../utils/formFields';
import { OUTPUT_FILE_PATH } from './functions/exportExcelDataFromDB';
import { findSheetToUpdate } from './functions/findSheetToUpdate';
import { getAccountIdFromHeader } from './functions/getAccountIdFromHeader';

global.localStorage = new LocalStorage('./scratch');

function getLandDescription(code: string) {
    const description = LOAI_DAT[code.toUpperCase()];
    return description ? description : '';
}

// In dữ liệu từ 1 row ra word
export const exportManytoWord = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;
        const listTamY = req.body.data;

        if (!listTamY) {
            res.status(400).send('No rows selected.');
            return;
        }

        const sheet = await findSheetToUpdate(fileId, sheetName);

        if (!sheet) {
            res.status(400).send('Sheet not found.');

            return;
        }

        const zipFileName = `document-${fileId}.zip`;
        const zipFilePath = `${OUTPUT_FILE_PATH}document-${fileId}.zip`; // Đường dẫn để lưu file zip

        const lstData = listTamY.split(',');

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

        lstData.forEach((tamY: string) => {
            const [soHieuToBanDo, soThuTuThua] = tamY.split('_');
            const dataDB = sheet.rows.find(
                (row: any) =>
                    row.get('soHieuToBanDo') == soHieuToBanDo &&
                    row.get('soThuTuThua') == soThuTuThua,
            );
            const nameFile =
                dataDB.get('soHieuToBanDo') + '_' + dataDB.get('soThuTuThua');
            const type = dataDB.get('loaiDon');

            dataDB.set('gioiTinh', dataDB.get('gioiTinh') == 1 ? 'Ông' : 'Bà');
            dataDB.set(
                'gioiTinh2',
                dataDB.get('gioiTinh2') == 1 ? 'Ông' : 'Bà',
            );
            dataDB.set(
                'gioiTinhCu',
                dataDB.get('gioiTinhCu') == 1 ? 'Ông' : 'Bà',
            );
            dataDB.set(
                'gioiTinhCu2',
                dataDB.get('gioiTinhCu2') == 1 ? 'Ông' : 'Bà',
            );

            const dientichtangthem = Number(dataDB.get('Dientichtangthem'));
            dataDB.set(
                'Dientichtangthem',
                parseFloat(dientichtangthem.toFixed(1)),
            );

            const loaiDat1: string = dataDB.get('loaiDat1');

            dataDB.set('loaiDat1', getLandDescription(loaiDat1));

            const loaiDat2 = dataDB.get('loaiDat2');
            dataDB.set('loaiDat2', getLandDescription(loaiDat2));

            const loaiDatCu1 = dataDB.get('loaiDatCu1');
            dataDB.set('loaiDatCu1', getLandDescription(loaiDatCu1));

            const loaiDatCu2 = dataDB.get('loaiDatCu2');
            dataDB.set('loaiDatCu2', getLandDescription(loaiDatCu2));

            const dataToWord = dataDB.toJSON();
            // eslint-disable-next-line no-var
            var pathFileTemplate = '';
            // eslint-disable-next-line no-var
            var content: PizZip.LoadData;
            try {
                if (type == 'Cấp mới') {
                    pathFileTemplate =
                        global.localStorage.getItem('wordCapMoi') || '';
                } else {
                    pathFileTemplate =
                        global.localStorage.getItem('wordCapDoi') || '';
                }

                if (
                    pathFileTemplate == null ||
                    pathFileTemplate == undefined ||
                    pathFileTemplate.trim() == ''
                ) {
                    res.status(404).send(
                        type == 'Cấp mới'
                            ? 'Bạn chưa upload file template word mẫu đơn cấp mới'
                            : 'Bạn chưa upload file template word mẫu đơn cấp đổi',
                    );
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
            const fileName = `${type}-${nameFile}.docx`;
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
    try {
        const { fileId, sheetName, tamY } = req.params;

        const sheet = await findSheetToUpdate(fileId, sheetName);

        if (!tamY) {
            res.status(400).send('No row selected.');
            return;
        }

        const [soHieuToBanDo, soThuTuThua] = tamY.split('_');
        const dataExport = sheet.rows.find(
            (row: any) =>
                row.get('soHieuToBanDo') == soHieuToBanDo &&
                row.get('soThuTuThua') == soThuTuThua,
        );

        if (!dataExport) {
            console.warn('Row not found.');
            res.status(400).send('Row not found.');
            return;
        }

        const type = dataExport.get('loaiDon');

        //convert giới tính
        dataExport.set(
            'gioiTinh',
            dataExport.get('gioiTinh') == 1 ? 'Ông' : 'Bà',
        );
        dataExport.set(
            'gioiTinh2',
            dataExport.get('gioiTinh2') == 1 ? 'Ông' : 'Bà',
        );
        dataExport.set(
            'gioiTinhCu',
            dataExport.get('gioiTinhCu') == 1 ? 'Ông' : 'Bà',
        );
        dataExport.set(
            'gioiTinhCu2',
            dataExport.get('gioiTinhCu2') == 1 ? 'Ông' : 'Bà',
        );

        //convert dientichtangthem
        const dientichtangthem = Number(dataExport.get('Dientichtangthem'));
        dataExport.set(
            'Dientichtangthem',
            parseFloat(dientichtangthem.toFixed(1)),
        );

        //convert loại đất
        const loaiDat1: string = dataExport.get('loaiDat1');

        dataExport.set('loaiDat1', getLandDescription(loaiDat1));

        const loaiDat2 = dataExport.get('loaiDat2');
        dataExport.set('loaiDat2', getLandDescription(loaiDat2));

        const loaiDatCu1 = dataExport.get('loaiDatCu1');
        dataExport.set('loaiDatCu1', getLandDescription(loaiDatCu1));

        const loaiDatCu2 = dataExport.get('loaiDatCu2');
        dataExport.set('loaiDatCu2', getLandDescription(loaiDatCu2));

        const dataToWord = dataExport.toJSON();
        // eslint-disable-next-line no-var
        var pathFileTemplate = '';
        // eslint-disable-next-line no-var
        var content: PizZip.LoadData;
        try {
            if (type == 'Cấp mới') {
                pathFileTemplate =
                    global.localStorage.getItem('wordCapMoi') || '';
            } else {
                pathFileTemplate =
                    global.localStorage.getItem('wordCapDoi') || '';
            }

            if (
                pathFileTemplate == null ||
                pathFileTemplate == undefined ||
                pathFileTemplate.trim() == ''
            ) {
                res.status(404).send(
                    type == 'Cấp mới'
                        ? 'Bạn chưa upload file template word mẫu đơn cấp mới'
                        : 'Bạn chưa upload file template word mẫu đơn cấp đổi',
                );
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
        const fileName = `word_file-${tamY}.docx`;

        fs.writeFileSync(
            path.resolve(__dirname, `../files/exports/${fileName}`),
            buf,
        );

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

        if (statistic.length > 0) {
            await Statistic.findByIdAndUpdate(
                statistic[0]._id,
                { count: Number(statistic[0]?.count) + 1 },
                {
                    new: true,
                },
            );
        } else {
            await Statistic.create({
                accountId,
                count: 1,
                createdAt: now,
            });
        }

        res.status(200).send('Tạo file thành công: ');
    } catch (error: any) {
        res.status(500).send('Error updating row: ' + error.message);
    }
};
