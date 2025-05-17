const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Wishlist')

Router.get('/', Controller.getWishlist);

Router.post('/add', Controller.addProductToWishlist);

Router.delete('/remove', Controller.removeProductFromWishlist);

module.exports = Router