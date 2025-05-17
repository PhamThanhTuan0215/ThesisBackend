const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Cart')

Router.get('/', Controller.getCart);

Router.post('/add', Controller.addProductToCart);

Router.delete('/remove', Controller.removeProductFromCart);

module.exports = Router