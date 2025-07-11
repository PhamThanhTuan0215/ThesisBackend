const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Order')

Router.get('/', Controller.getOrder)

Router.post('/', Controller.createOrder)

Router.put('/:id', Controller.updateOrder)

Router.delete('/:id', Controller.cancelOrder)

Router.get('/user', Controller.getOrderByUserId) // ĐANG DÙNG USER_ID TRONG QUERY

Router.get('/shop/:seller_id', Controller.getOrderBySellerId)

Router.get('/:id', Controller.getOrderById)

Router.get('/details/:id', Controller.getOrderDetails)

module.exports = Router