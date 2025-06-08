const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/Store');

// Route tạo cửa hàng mới
Router.post('/', Controller.uploadCustom, Controller.createStore);

// Route lấy danh sách cửa hàng với phân trang và filter
Router.get('/', Controller.getAllStores);

// Route lấy danh sách cửa hàng với danh sách store_id
Router.post('/list', Controller.getStoresByIds);

// Route lấy thông tin một cửa hàng
Router.get('/:id', Controller.getStore);

// Route cập nhật thông tin cơ bản của cửa hàng
Router.put('/:id', Controller.updateStore);

// Route cập nhật trạng thái cửa hàng
Router.patch('/:id/status', Controller.updateStoreStatus);

// Route cập nhật avatar của cửa hàng
Router.patch('/:id/avatar', Controller.uploadAvatar, Controller.updateStoreAvatar);

// Route cập nhật banner của cửa hàng
Router.patch('/:id/banner', Controller.uploadBanner, Controller.updateStoreBanner);

// Route cập nhật giấy phép của cửa hàng
Router.patch('/:id/license', Controller.uploadLicense, Controller.updateStoreLicense);

// Route xóa cửa hàng
Router.delete('/:id', Controller.deleteStore);

module.exports = Router;