import Docxtemplater from 'docxtemplater';
import { Request, Response } from 'express';
import fs from 'fs';
import Statistic from 'models/statistic';
import PizZip from 'pizzip';
import { findSheetToUpdate } from 'services/functions/findSheetToUpdate';
import { AuthenticatedRequest } from 'services/types';
import { EXPORTS_PATH, TEMPLATES_PATH } from 'storages/consts';
import { getLandDescription } from './functions/getLandDescription';
import archiver from 'archiver';

export const exportRowsToWord = async (
    req: Request,
    res: Response,
    // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;
        const listTamY = req.body.data;

        if (!listTamY) {
            res.status(400).send('No rows selected.');
            return;
        }

        const sheet = await findSheetToUpdate({ fileId, sheetName });

        const zipFileName = `document-${fileId}.zip`;
        const zipFilePath = `${EXPORTS_PATH}/document-${fileId}.zip`; // Đường dẫn để lưu file zip

        const lstData = listTamY.split(',');

        // Tạo stream để ghi dữ liệu vào file zip
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        output.on('close', async () => {
            const now = new Date();

            // Tạo thời gian bắt đầu của ngày hôm nay (00:00:00)
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));

            // Tạo thời gian kết thúc của ngày hôm nay (23:59:59.999)
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));

            const accountId = (req as AuthenticatedRequest).user?.id;
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
            if (!dataDB) {
                console.warn('Row not found.');
                return;
            }
            const nameFile =
                dataDB.get('soHieuToBanDo') + '_' + dataDB.get('soThuTuThua');
            const type = dataDB.get('loaiDon');

            const dataToWord = convertDataToWord(dataDB);

            let content: PizZip.LoadData;
            try {
                const templateKey =
                    type === 'Cấp mới' ? 'wordCapMoi.docx' : 'wordCapDoi.docx';
                const pathFileTemplate = `${TEMPLATES_PATH}/${templateKey}`;

                if (!pathFileTemplate?.trim()) {
                    res.status(404).send(
                        type === 'Cấp mới'
                            ? 'Bạn chưa upload file template word mẫu đơn cấp mới'
                            : 'Bạn chưa upload file template word mẫu đơn cấp đổi',
                    );
                    return;
                }

                content = fs.readFileSync(pathFileTemplate, 'binary');
            } catch (error: any) {
                res.status(404).send('Bạn chưa upload file template word.');
                return;
            }

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                nullGetter: () => {
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

            archive.append(buf, { name: fileName }); // Thêm file .docx vào file zip
        });

        // Kết thúc và tạo file zip
        await archive.finalize();
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exporting file');
    }
};

function convertDataToWord(dataDB: any): any {
    const genderFields = ['gioiTinh', 'gioiTinh2', 'gioiTinhCu', 'gioiTinhCu2'];
    genderFields.forEach((field) => {
        dataDB.set(field, dataDB.get(field) == 1 ? 'Ông' : 'Bà');
    });

    const dientichTangThem = parseFloat(
        Number(dataDB.get('Dientichtangthem')).toFixed(1),
    );
    dataDB.set('Dientichtangthem', dientichTangThem);

    const landFields = ['loaiDat1', 'loaiDat2', 'loaiDatCu1', 'loaiDatCu2'];
    landFields.forEach((field) => {
        dataDB.set(field, getLandDescription(dataDB.get(field)));
    });

    dataDB.set('hoGiaDinh', dataDB.get('hoGiaDinh') === 'ho' ? 'Hộ' : '');

    return dataDB.toJSON();
}
