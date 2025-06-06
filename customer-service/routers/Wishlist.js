const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Wishlist')

Router.get('/', Controller.getWishlist); // user_id trong query

Router.get('/product-ids', Controller.getProductIds); // user_id trong query

Router.post('/add', Controller.addProductToWishlist);

Router.delete('/remove', Controller.removeProductFromWishlist); // user_id và product_id trong query

module.exports = Router