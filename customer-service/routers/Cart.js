const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Cart')

const authenticateToken = require('../middlewares/auth');

Router.get('/', Controller.getCart); // user_id trong query

Router.get('/checkout', Controller.getCartToCheckout); // user_id trong query

Router.post('/add', Controller.addProductToCart); // thêm mới hoặc tăng số lượng

Router.delete('/reduce/:id', Controller.reduceProductInCart); // giảm số lượng (xóa nếu số lượng về 0)

Router.delete('/remove/:id', Controller.removeProductFromCart); // xóa sản phẩm

Router.post('/remove', Controller.removeManyProductFromCart); // xóa đồng thời nhiều sản phẩm

module.exports = Router