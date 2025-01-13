import { Request, Response } from 'express';
import ExcelFile from 'models/excelFile';

export const searchDataByNameAndDate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;
        const { name, date } = req.query;

        const rowConditions: any = {};
        if (name) {
            rowConditions['hoTen'] = { $regex: name, $options: 'i' };
        }
        if (date) {
            rowConditions['namSinh'] = date;
        }

        if (name === '' && date === '') {
            res.status(200).send('Chưa nhập dữ liệu tìm kiếm');
            return;
        }

        const file = await ExcelFile.findOne({
            gridFSId: fileId,
            sheets: {
                $elemMatch: {
                    sheetName,
                    rows: {
                        $elemMatch: rowConditions,
                    },
                },
            },
        })
            .select('sheets.$')
            .lean();

        if (!file || !file.sheets || !file.sheets.length) {
            res.status(404).send('Rows not found.');
            return;
        }

        const rows = file.sheets[0].rows.filter((r: any) => {
            const matchesName = name
                ? new RegExp(String(name), 'i').test(r.hoTen)
                : true;
            const matchesDate = date ? r.namSinh === date : true;
            return matchesName && matchesDate;
        });

        if (rows.length === 0) {
            res.status(404).send('Rows not found.');
        } else {
            res.json({ data: rows });
        }
    } catch (error: any) {
        console.error('Error find data:', error);
        res.status(500).send('Error find data: ' + error.message);
    }
};
