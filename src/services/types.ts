import { Request } from 'express';

export type RowData = Map<string, string>;
export interface Sheet {
    sheetName: string;
    rows: RowData[];
}

export interface User {
    id: string;
    role: string;
}

export interface AuthenticatedRequest extends Request {
    user?: User;
}
