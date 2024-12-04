export const mapFileResult = (file: any) => {
    return {
        id: file.gridFSId?.toString(), // Thay đổi id thành gridFSId
        fileName: file.fileName,
        uploadedAt: file.uploadedAt,
        sheetNames: file.sheetNames,
        deletedAt: file.deletedAt,
    };
};
