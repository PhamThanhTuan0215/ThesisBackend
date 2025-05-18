const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Wishlist')

Router.get('/', Controller.getWishlist); // user_id trong query

Router.post('/add', Controller.addProductToWishlist);

Router.delete('/remove/:id', Controller.removeProductFromWishlist);

module.exports = Router