const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/ShopVoucher')

const authenticateToken = require('../middlewares/auth');

Router.get('/:seller_id', Controller.getVouchers)

Router.get('/:seller_id/:id', Controller.getVoucherById)

Router.post('/:seller_id', Controller.createVoucher)

Router.put('/:seller_id/:id', Controller.updateVoucher)

Router.delete('/:seller_id/:id', Controller.deleteVoucher)

Router.put('/:seller_id/status/:id', Controller.updateVoucherStatus)

module.exports = Router