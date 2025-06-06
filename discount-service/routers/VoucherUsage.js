const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/VoucherUsage')

// lấy tất cả voucher khả dụng (sàn + tất cả shop)
Router.get('/all-avaiable-vouchers', Controller.getAvailableVouchers)

Router.get('/platform', Controller.getPlatformAvailableVouchers) //  ĐANG DÙNG USER_ID TRONG QUERY

Router.get('/shop/:seller_id', Controller.getShopAvailableVouchers) // ĐANG DÙNG USER_ID TRONG QUERY

Router.post('/shops', Controller.getAvailableVouchersOfManyShops) // ĐANG DÙNG USER_ID TRONG QUERY. lấy danh sách voucher khả dụng của nhiều nhà bán cùng lúc

Router.post('/apply', Controller.applyPlatformVoucher) // áp dụng voucher của sàn

Router.post('/apply/:seller_id', Controller.applyShopVoucher) // áp dụng voucher của cửa hàng

Router.post('/save', Controller.saveVoucherUsage)   // lưu lại voucher đã áp dụng

Router.get('/get-by-order/:order_id', Controller.getVoucherUsageByOrderId) // lấy voucher đã áp dụng theo order_id

Router.get('/get-by-user', Controller.getVoucherUsageByUserId) // ĐANG DÙNG USER_ID TRONG QUERY

Router.delete('/restore/:order_id', Controller.restoreVoucherUsage) // hoàn lại voucher khi hủy đơn

module.exports = Router