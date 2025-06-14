const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/user_seller_access');

// const authenticateToken = require('../middlewares/auth');

// Route tạo quyền truy cập mới
Router.post('/', Controller.createAccess);

// Route lấy danh sách quyền truy cập với filter và phân trang
Router.get('/', Controller.getAllAccesses);

// Route lấy thông tin quyền truy cập của store_id by user_id
Router.get('/user/:user_id', Controller.getAccessByUserId);

// Route lấy thông tin một quyền truy cập
Router.get('/:id', Controller.getAccess);

// Route cập nhật quyền truy cập
Router.put('/:id', Controller.updateAccess);

// Route xóa quyền truy cập
Router.delete('/:id', Controller.deleteAccess);

module.exports = Router; 