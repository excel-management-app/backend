import Docxtemplater from 'docxtemplater';
import { Request, Response } from 'express';
import fs from 'fs';
import Statistic from 'models/statistic';
import PizZip from 'pizzip';
import { findSheetToUpdate } from 'services/functions/findSheetToUpdate';
import { AuthenticatedRequest } from 'services/types';
import { EXPORTS_PATH, TEMPLATES_PATH } from 'storages/consts';
import { getLandDescription } from './functions/getLandDescription';

export const exportRowToWord = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName, tamY } = req.params;

        const sheet = await findSheetToUpdate({ fileId, sheetName, tamY });

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

        const dataToWord = convertDataToWord(dataExport);

        const templateKey =
            type === 'Cấp mới' ? 'wordCapMoi.docx' : 'wordCapDoi.docx';
        const pathFileTemplate = `${TEMPLATES_PATH}/${templateKey}`;

        if (!pathFileTemplate.trim()) {
            res.status(404).send(
                type === 'Cấp mới'
                    ? 'Bạn chưa upload file template word mẫu đơn cấp mới'
                    : 'Bạn chưa upload file template word mẫu đơn cấp đổi',
            );
            return;
        }

        let content: PizZip.LoadData;
        try {
            content = fs.readFileSync(pathFileTemplate, 'binary');
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

        fs.writeFileSync(`${EXPORTS_PATH}/${fileName}`, buf);

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
        res.status(500).send('Error export row: ' + error.message);
    }
};

export function convertDataToWord(dataExport: any) {
    const genderFields = ['gioiTinh', 'gioiTinh2', 'gioiTinhCu', 'gioiTinhCu2'];
    genderFields.forEach((field) => {
        dataExport.set(field, dataExport.get(field) == 1 ? 'Ông' : 'Bà');
    });

    const dientichtangthem = parseFloat(
        Number(dataExport.get('Dientichtangthem')).toFixed(1),
    );
    dataExport.set('Dientichtangthem', dientichtangthem);

    const landFields = ['loaiDat1', 'loaiDat2', 'loaiDatCu1', 'loaiDatCu2'];
    landFields.forEach((field) => {
        dataExport.set(field, getLandDescription(dataExport.get(field)));
    });

    dataExport.set(
        'hoGiaDinh',
        dataExport.get('hoGiaDinh') == 'ho' ? 'Hộ' : '',
    );
    return dataExport.toJSON();
}
