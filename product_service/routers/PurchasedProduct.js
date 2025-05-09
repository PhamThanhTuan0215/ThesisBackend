const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/PurchasedProduct')

// endpoint tạo các purchased_products khi tạo đơn hàng

// endpoint cập nhật trạng thái các purchased_products khi đơn hàng hoàn thành hoặc hoàn trả đơn

// endpoint xóa các purchased_products khi hủy đơn hàng

module.exports = Router