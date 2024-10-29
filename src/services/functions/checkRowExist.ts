/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
    files: any;
    sheetName: string;
    tamY: string;
}

export function checkRowExist({ files, sheetName, tamY }: Props) {
    let fileToUpdate: any = null;
    let sheetToUpdate: any = null;
    let rowIndexToUpdate: number = -1;

    for (const file of files) {
        for (const sheet of file.sheets) {
            if (sheet.sheetName === sheetName) {
                const rowIndex = sheet.rows.findIndex(
                    (row: any) =>
                        row.tamY === tamY ||
                        `${row.soHieuToBanDo}_${row.soThuTuThua}` === tamY,
                );

                if (rowIndex !== -1) {
                    fileToUpdate = file;
                    sheetToUpdate = sheet;
                    rowIndexToUpdate = rowIndex;
                    break;
                }
            }
        }
        if (fileToUpdate) {
            break;
        }
    }

    return { fileToUpdate, sheetToUpdate, rowIndexToUpdate };
}
