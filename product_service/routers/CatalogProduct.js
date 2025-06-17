const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/CatalogProduct')

const authenticateToken = require('../middlewares/auth');

// admin lấy danh sách sản phẩm trong danh mục cho phép
Router.get('/', Controller.getAllCatalogProducts)

// admin lấy thông tin sản phẩm trong danh mục cho phép
Router.get('/:id', Controller.getCatalogProductById)

// admin thêm sản phẩm vào danh mục cho phép
Router.post('/', Controller.uploadCustom, Controller.addCatalogProduct)

// admin xóa sản phẩm khỏi danh mục cho phép
Router.delete('/:id', Controller.deleteCatalogProduct)

// admin cập nhật sản phẩm trong danh mục cho phép
Router.put('/:id', Controller.uploadCustom, Controller.updateCatalogProduct)

// admin quản lý trạng thái hoạt động của sản phẩm trong danh mục cho phép
Router.put('/:id/set-active', Controller.setActiveCatalogProduct)

module.exports = Router