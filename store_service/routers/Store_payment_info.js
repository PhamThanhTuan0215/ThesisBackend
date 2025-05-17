const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/Store_payment_info');

// Route tạo phương thức thanh toán mới
Router.post('/', Controller.uploadQRCode, Controller.createPaymentInfo);

// Route lấy thông tin một phương thức thanh toán
Router.get('/:id', Controller.getPaymentInfo);

// Route lấy danh sách phương thức thanh toán của một cửa hàng
Router.get('/store/:store_id', Controller.getStorePaymentInfos);

// Route cập nhật thông tin thanh toán
Router.put('/:id', Controller.uploadQRCode, Controller.updatePaymentInfo);

// Route xóa phương thức thanh toán
Router.delete('/:id', Controller.deletePaymentInfo);

module.exports = Router;
