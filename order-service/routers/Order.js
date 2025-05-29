const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Order')

Router.get('/', Controller.getOrder)

Router.post('/', Controller.createOrder)

Router.put('/:id', Controller.updateOrder)

Router.delete('/:id', Controller.cancelOrder)

Router.get('/:id', Controller.getOrderById)

Router.get('/user/:user_id', Controller.getOrderByUserId)

Router.get('/shop/:seller_id', Controller.getOrderBySellerId)

module.exports = Router