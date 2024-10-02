import { Request, Response } from "express";
import {configModel} from "../models/configModel";
import mongoose from "mongoose";
import { ParsedQs } from "qs";


const fileNameEx = 'data.xls';
const dataDB = async () => { 
    var arrDB =  await configModel.find({fileName: fileNameEx}).exec();
    return arrDB;
}

const sheetName = 'Sheet1';

const listData = async () => {
    // lấy ra dữ liệu trong mongo
    var arrDB = await dataDB();
    // Trả về list data có trong sheet
    const objData = arrDB[0].sheets;
    const dataSheet = objData.find(sheet => sheet.sheetName === sheetName);
    // const result = arrDB[0].data[sheetName];
    return dataSheet;
}


export const createDataService = async (req: Request, res: Response) => {
    const dataCreate = req.body.data;
    // gửi lên dạng {"data":{"A": "test", "B": "15_09", "C": "33"}}
    console.log("dataCreate====",dataCreate)
    var db = await listData();
    // return db
    // kiểm tra có dữ liệu trùng trong mảng chưa
    const existsData = db.rows.some((item: { B: any; }) => item.B === dataCreate.B);

    if (!existsData) {
        db.rows.push(dataCreate);
        var arrDB = await dataDB();

        // update sheet trong db = sheet hiện tại
        var sheetDB = arrDB[0].sheets
        const sheetUpdate = sheetDB.map(sheet => 
            sheet.sheetName === db.sheetName ? db : sheet
        );
        return sheetUpdate
        // arrDB[0].data[sheetName] = db;  // replace data sheet cũ bằng sheet mới
        // arrDB[0].updatedAt = new Date(); 
        
        // var dataUpdate = {
        //     data: arrDB[0].data  // data update mongo
        // }
        // try{
        //     const saveData = await configModel.findByIdAndUpdate(arrDB[0]._id, dataUpdate);
        //     return {status: 200, message: "Đã thêm mới dữ liệu thành công"};
        // }
        // catch {
        //     return {status: 400, message: "Không thêm được dữ liệu"};
        // }
        // const saveData = await configModel.findOneAndReplace

       
    } else {
        return {status: 401, message: "Dữ liệu này đã được nhập vào trước đó rồi"};
    }

    
}

export const editDataService = async (req: Request, res: Response) => {
     // gửi lên dạng {"data":["null","68_86","88"]}
    const dataUpdate = req.body.data;
    console.log("dataUpdate====",dataUpdate)
    var db = await listData();
    return db
    // const index = db.findIndex((arr: any[]) => arr[1] === dataUpdate[1]); // tìm kiếm array chứa key gửi lên

    // if (index !== -1) {
    //     db[index] = dataUpdate;

    //     var arrDB = await dataDB();

    //     arrDB[0].data[sheetName] = db;  // replace data sheet cũ bằng sheet mới
    //     arrDB[0].updatedAt = new Date(); 
        
    //     var dataSave = {
    //         data: arrDB[0].data  // data update mongo
    //     }

    //     try{
    //         const saveData = await configModel.findByIdAndUpdate(arrDB[0]._id, dataSave);
    //         return {status: 200, message: "Cập nhật dữ liệu thành công"};
    //     }
    //     catch {
    //         return {status: 400, message: "Lỗi khi update"};
    //     }
    // } else {
    //     return {status: 404, message: "Không tìm thấy dữ liệu để update"};
    // }
}


export const searchDataService = async (req: Request, res: Response) => {
    const dataSearch = req.query;     // gửi lên theo url?key=68_86
    console.log("dataSearch----", dataSearch)     
    var db = await listData();
    if(Object.keys(dataSearch).length == 0) {
        // nếu không tìm kiếm gì thì trả về full
        return db.rows;
    } else {
        // có gửi lên tìm kiếm thì trả về dữ liệu của object chứa key của dòng dạng "68_86"
        const data = db.rows.find((item: { B: string }) => item.B === dataSearch.key);
        return data;
    }
    
}

