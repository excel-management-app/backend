export const formatDate = (date: Date) => {
    let day = date.getDate();
    let month = date.getMonth() + 1; // Tháng trong JavaScript bắt đầu từ 0 nên cần cộng thêm 1
    let year = date.getFullYear();

    // Đảm bảo ngày và tháng có 2 chữ số
    day = Number(day < 10 ? '0' + day : day);
    month = Number(month < 10 ? '0' + month : month);

    return `${day}/${month}/${year}`;
};
