export type RowData = Map<string, string>;
export interface Sheet {
    sheetName: string;
    rows: RowData[];
}
