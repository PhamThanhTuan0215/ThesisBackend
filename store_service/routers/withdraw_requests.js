const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/withdraw_requests');

// const authenticateToken = require('../middlewares/auth');

// Route tạo yêu cầu rút tiền mới
Router.post('/', Controller.createWithdrawRequest);

// Route lấy danh sách yêu cầu rút tiền với filter và phân trang
Router.get('/', Controller.getAllWithdrawRequests);

// Route cập nhật status yêu cầu rút tiền theo id
Router.put('/status/:id', Controller.updateWithdrawRequestStatus);

// Route lấy thông tin một yêu cầu rút tiền
Router.get('/:id', Controller.getWithdrawRequest);

// Route cập nhật yêu cầu rút tiền
Router.put('/:id', Controller.updateWithdrawRequest);

// Route xóa yêu cầu rút tiền
Router.delete('/:id', Controller.deleteWithdrawRequest);

module.exports = Router; 