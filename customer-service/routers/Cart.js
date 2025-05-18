const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Cart')

Router.get('/', Controller.getCart); // user_id trong query

Router.post('/add', Controller.addProductToCart);

Router.delete('/remove/:id', Controller.removeProductFromCart);

module.exports = Router