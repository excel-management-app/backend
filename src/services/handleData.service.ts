import { Request, Response } from "express";
import {configModel} from "../models/configModel";
import mongoose from "mongoose";

const dataDB = async () => { 
    var arrDB =  await configModel.find().exec();
    return arrDB;
}

const sheetName = 'file test';

const listData = async () => {
    var arrDB = await dataDB();
    // truyền lên tên file sheet đã lưu trong db
    // Trả về list data có trong sheet

    const result = arrDB[0].data[sheetName];
    return result;
}


export const createDataService = async (req: Request, res: Response) => {
    const dataCreate = req.body.data;
    // gửi lên dạng {"data":["null","63_51","71_52"]}
    console.log("dataCreate====",dataCreate)
    var db = await listData();

    // kiểm tra có dữ liệu trùng trong mảng chưa
    const existsData = db.some((arr: any[]) => arr[1] === dataCreate[1]);

    if (!existsData) {
        db.push(dataCreate);

        var arrDB = await dataDB();

        arrDB[0].data[sheetName] = db;  // replace data sheet cũ bằng sheet mới
        arrDB[0].updatedAt = new Date(); 
        
        var dataUpdate = {
            data: arrDB[0].data  // data update mongo
        }
        try{
            const saveData = await configModel.findByIdAndUpdate(arrDB[0]._id, dataUpdate);
            return {status: 200, message: "Đã thêm mới dữ liệu thành công"};
        }
        catch {
            return {status: 400, message: "Không thêm được dữ liệu"};
        }
        // const saveData = await configModel.findOneAndReplace

       
    } else {
        return {status: 401, message: "Dữ liệu này đã được nhập vào trước đó rồi"};
    }

    
}

export const editDataService = async (req: Request, res: Response) => {
     // gửi lên dạng {"data":["null","63_51","71_52"]}
    const dataUpdate = req.body.data;
    console.log("dataUpdate====",dataUpdate)
    var db = await listData();

    const index = db.findIndex((arr: any[]) => arr[1] === dataUpdate[1]); // tìm kiếm array chứa key gửi lên

    if (index !== -1) {
        db[index] = dataUpdate;

        var arrDB = await dataDB();

        arrDB[0].data[sheetName] = db;  // replace data sheet cũ bằng sheet mới
        arrDB[0].updatedAt = new Date(); 
        
        var dataSave = {
            data: arrDB[0].data  // data update mongo
        }

        try{
            const saveData = await configModel.findByIdAndUpdate(arrDB[0]._id, dataSave);
            return {status: 200, message: "Cập nhật dữ liệu thành công"};
        }
        catch {
            return {status: 400, message: "Lỗi khi update"};
        }
    } else {
        return {status: 404, message: "Không tìm thấy dữ liệu để update"};
    }
}


export const searchDataService = async (req: Request, res: Response) => {
    const dataSearch = req.query;     
    console.log("dataSearch----", dataSearch)     
    var db = await listData();
    if(Object.keys(dataSearch).length == 0) {
        // nếu không tìm kiếm gì thì trả về full
        return db;
    } else {
        // có gửi lên tìm kiếm thì trả về dữ liệu của array đấy theo key của dòng dạng "60_12"
        const data = db.filter((arr: any[]) => arr[1] === dataSearch.key);
        return data;
    }
    
}

