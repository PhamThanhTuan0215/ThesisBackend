const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/VoucherUsage')

Router.get('/platform', Controller.getPlatformVouchersAvailable) // đang dùng user_id trong query

Router.get('/shop/:seller_id', Controller.getShopVouchersAvailable) // đang dùng user_id trong query

Router.post('/apply', Controller.applyVoucher) // kiểm tra điều kiện và áp dụng voucher

Router.post('/save', Controller.saveVoucherUsage)   // lưu lại voucher đã áp dụng

Router.delete('/restore/:order_id', Controller.restoreVoucherUsage) // hoàn lại voucher khi hủy đơn

module.exports = Router