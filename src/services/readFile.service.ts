import * as XLSX from 'xlsx'

export const readFileService = (sheetName?: string) => {
    const filePath = `src/public/file_example_XLS_1000.xls`
    const workbook = XLSX.readFile(filePath)
    const worksheet = sheetName
        ? workbook.Sheets[sheetName]
        : workbook.Sheets[workbook.SheetNames[0]]

    return {
        data: XLSX.utils.sheet_to_json(worksheet, { header: 1 }),
        sheetNames: workbook.SheetNames
    }
}
