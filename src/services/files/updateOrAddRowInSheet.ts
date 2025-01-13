import { Request, Response } from 'express';
import ExcelFile from 'models/excelFile';
import { checkRowExist } from 'services/files/functions/checkRowExist';
import { getFileDataByFileId } from 'services/files/functions/getFileDataByFileId';
import { AuthenticatedRequest } from 'services/types';

export const updateOrAddRowInSheet = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { fileId, sheetName } = req.params;

        const rowData = req.body.data;
        const accountId = (req as AuthenticatedRequest).user?.id;
        const tamY = `${rowData.soHieuToBanDo}_${rowData.soThuTuThua}`;

        const files = await getFileDataByFileId(fileId);
        if (!files || files.length === 0) {
            res.status(404).send('File not found.');
            return;
        }

        // Destructuring để dễ truy cập và sử dụng
        const { fileToUpdate, sheetToUpdate, rowIndexToUpdate } = checkRowExist(
            {
                files,
                sheetName,
                tamY,
            },
        );

        const newRow = {
            ...rowData,
            tamY,
            accountId,
        };

        // Nếu tìm thấy file và sheet, tiến hành cập nhật hoặc thêm row
        if (fileToUpdate && sheetToUpdate) {
            if (rowIndexToUpdate !== -1) {
                // Cập nhật row đã tồn tại
                await ExcelFile.bulkWrite([
                    {
                        updateOne: {
                            filter: {
                                _id: fileToUpdate._id,
                                'sheets.sheetName': sheetName,
                            },
                            update: {
                                $set: { 'sheets.$.rows.$[row]': newRow },
                            },
                            arrayFilters: [{ 'row.tamY': tamY }],
                        },
                    },
                ]);
                res.status(200).json({ message: 'Row updated successfully' });
            } else {
                // Thêm row mới vào sheet đã tồn tại
                await ExcelFile.updateOne(
                    { _id: fileToUpdate._id, 'sheets.sheetName': sheetName },
                    { $push: { 'sheets.$.rows': newRow } },
                );
                res.status(200).json({
                    message: 'Row added successfully',
                    tamY,
                });
            }
        } else if (fileToUpdate) {
            // Nếu file tồn tại nhưng sheet chưa có, thêm sheet và row mới
            await ExcelFile.updateOne(
                { _id: fileToUpdate._id },
                { $push: { sheets: { sheetName, rows: [newRow] } } },
            );
            res.status(200).json({
                message: 'Sheet and row added successfully',
                tamY,
            });
        } else {
            res.status(404).send('File not found for update or addition.');
        }
    } catch (error: any) {
        console.error('Error updating or adding row:', error);
        res.status(500).send('Error updating or adding row: ' + error.message);
    }
};
