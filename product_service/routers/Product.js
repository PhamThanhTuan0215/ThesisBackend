const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Product')

Router.get('/', Controller.getAllProducts)

module.exports = Router