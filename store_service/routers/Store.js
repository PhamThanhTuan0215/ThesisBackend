const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/Store');

const authenticateToken = require('../middlewares/auth');

// Route tạo cửa hàng mới
Router.post('/', Controller.uploadCustom, Controller.createStore);

// Route lấy danh sách cửa hàng với phân trang và filter
Router.get('/', Controller.getAllStores);

// Route lấy danh sách cửa hàng với danh sách store_id
Router.post('/list', Controller.getStoresByIds);

// Route cập nhật balance của cửa hàng
Router.put('/:id/balance', Controller.updateStoreBalance);

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

// --- License routes ---
// Thêm giấy phép mới cho cửa hàng (nếu muốn thêm ngoài 4 loại bắt buộc)
Router.post('/:id/license', Controller.uploadLicense, Controller.addLicense);
// Cập nhật giấy phép cụ thể
Router.patch('/:id/license/:licenseId', Controller.uploadLicense, Controller.updateLicense);
// Cập nhật trạng thái giấy phép
Router.patch('/:id/license/:licenseId/status', Controller.updateLicenseStatus);

// Xóa giấy phép cụ thể
Router.delete('/:id/license/:licenseId', Controller.deleteLicense);

// --- Store photo routes ---
// Thêm ảnh cửa hàng
Router.post('/:id/photo', Controller.uploadLicense, Controller.addStorePhoto);
// Cập nhật ảnh cửa hàng
Router.patch('/:id/photo/:photoId', Controller.uploadLicense, Controller.updateStorePhoto);
// Xóa ảnh cửa hàng
Router.delete('/:id/photo/:photoId', Controller.deleteStorePhoto);

// Route xóa cửa hàng
Router.delete('/:id', Controller.deleteStore);

module.exports = Router;