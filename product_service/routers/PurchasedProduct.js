const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/PurchasedProduct')

Router.post('/add', Controller.addPurchasedProduct)

Router.put('/update-status', Controller.updateStatusPurchasedProduct)

Router.delete('/cancel/:order_id', Controller.deletePurchasedProduct)

module.exports = Router