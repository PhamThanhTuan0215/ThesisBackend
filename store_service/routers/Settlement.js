const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/Settlement');

// Route tạo kỳ thanh toán mới
Router.post('/', Controller.createSettlement);

// Route lấy thông tin một kỳ thanh toán
Router.get('/:id', Controller.getSettlement);

// Route lấy danh sách kỳ thanh toán của một cửa hàng
Router.get('/store/:store_id', Controller.getStoreSettlements);

// Route lấy danh sách tất cả kỳ thanh toán
Router.get('/', Controller.getAllSettlements);

// Route cập nhật thông tin kỳ thanh toán
Router.put('/:id', Controller.updateSettlement);

// Route cập nhật trạng thái kỳ thanh toán
Router.patch('/:id/status', Controller.updateSettlementStatus);

// Route xóa kỳ thanh toán
Router.delete('/:id', Controller.deleteSettlement);

// Route tạo kỳ thanh toán hàng loạt
Router.post('/bulk', Controller.createBulkSettlements);

module.exports = Router;
