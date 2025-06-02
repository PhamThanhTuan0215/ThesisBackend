const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Report')

Router.get('/products', Controller.reportProducts) // có thể truyền seller_id nếu muốn thống kê riêng cho nhà bán

module.exports = Router