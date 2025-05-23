const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/VoucherUsage')

Router.get('/platform', Controller.getPlatformVouchersAvailable) // đang dùng user_id trong query

Router.get('/shop/:seller_id', Controller.getShopVouchersAvailable) // đang dùng user_id trong query

Router.post('/apply', Controller.applyVoucher)

module.exports = Router