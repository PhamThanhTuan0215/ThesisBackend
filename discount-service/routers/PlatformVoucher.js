const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/PlatformVoucher')

Router.get('/', Controller.getVouchers)

Router.get('/:id', Controller.getVoucherById)

Router.post('/', Controller.createVoucher)

Router.put('/:id', Controller.updateVoucher)

Router.put('/status/:id', Controller.updateVoucherStatus)

Router.delete('/:id', Controller.deleteVoucher)

module.exports = Router