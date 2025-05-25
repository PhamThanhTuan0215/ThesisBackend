const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/VoucherUsage')

Router.get('/platform', Controller.getPlatformVouchersAvailable) //  ĐANG DÙNG USER_ID TRONG QUERY

Router.get('/shop/:seller_id', Controller.getShopVouchersAvailable) // đang dùng user_id trong query

Router.post('/apply', Controller.applyPlatformVoucher) // áp dụng voucher của sàn

Router.post('/apply/:seller_id', Controller.applyShopVoucher) // áp dụng voucher của cửa hàng

Router.post('/save', Controller.saveVoucherUsage)   // lưu lại voucher đã áp dụng

Router.get('/get-by-order/:order_id', Controller.getVoucherUsageByOrderId) // lấy voucher đã áp dụng theo order_id

Router.get('/get-by-user', Controller.getVoucherUsageByUserId) // ĐANG DÙNG USER_ID TRONG QUERY

Router.delete('/restore/:order_id', Controller.restoreVoucherUsage) // hoàn lại voucher khi hủy đơn

module.exports = Router