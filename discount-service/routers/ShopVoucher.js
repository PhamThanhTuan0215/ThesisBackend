const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/ShopVoucher')

Router.get('/:seller_id', Controller.getVouchers)

Router.get('/:seller_id/:id', Controller.getVoucherById)

Router.post('/:seller_id', Controller.createVoucher)

Router.put('/:seller_id/:id', Controller.updateVoucher)

Router.delete('/:seller_id/:id', Controller.deleteVoucher)

module.exports = Router