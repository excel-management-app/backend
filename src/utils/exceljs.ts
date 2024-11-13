import { cloneDeep } from 'lodash';
import { ExcelIndexedColors } from '../constants/excelColors';

interface ColorStyle {
    indexed?: number;
    argb?: string;
}

interface CellStyle {
    fill?: {
        fgColor?: ColorStyle;
        bgColor?: ColorStyle;
    };
    font?: {
        color?: ColorStyle;
    };
}

export function convertIndexedStyles(cell: any): CellStyle {
    if (!cell?.style) {
        return {};
    }

    const cellStyles = cloneDeep(cell.style);

    const convertColor = (color?: ColorStyle): void => {
        if (!color?.indexed) {
            return;
        }
        color.argb = ExcelIndexedColors[color.indexed];
        delete color.indexed;
    };

    convertColor(cellStyles.fill?.fgColor);
    convertColor(cellStyles.fill?.bgColor);
    convertColor(cellStyles.font?.color);

    return cellStyles;
}
