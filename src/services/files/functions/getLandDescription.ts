import { LOAI_DAT } from 'utils/formFields';

export function getLandDescription(code: string | undefined): string {
    if (!code) {
        return '';
    }
    const description = LOAI_DAT[code.toUpperCase()];
    return description ? description : '';
}
