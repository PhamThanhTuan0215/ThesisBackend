const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Product')

Router.get('/list-product', Controller.getAllProducts) // cung cấp các điều kiện lọc tại đây

Router.get('/brands', Controller.getAllBrands);

Router.get('/:id', Controller.getProductById)

Router.get('/display-for-customer/:id', Controller.getProductByIdForCustomer) // chỉ lấy các thông tin cần thiết

Router.post('/add-product', Controller.uploadCustom, Controller.addProduct)

Router.delete('/delete-product/:id', Controller.uploadCustom, Controller.deleteProduct)

Router.put('/approval-product/:id', Controller.uploadCustom, Controller.approvalProduct)

Router.put('/set-active-product/:id', Controller.uploadCustom, Controller.setActiveProduct)

module.exports = Router