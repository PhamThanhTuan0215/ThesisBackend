const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/ProductType')

Router.get('/list-product-type', Controller.getAllProductTypes)

Router.post('/add-product-type', Controller.addProductType)

Router.delete('/delete-product-type/:id', Controller.deleteProductType)

Router.put('/update-product-type/:id', Controller.updateProductType)

Router.get('/list-detail-attribute/:product_type_id', Controller.getDetailAttributes)

Router.post('/add-detail-attributes/:product_type_id', Controller.addDetailAttributes)

Router.delete('/delete-detail-attribute/:id', Controller.deleteDetailAttribute)

Router.put('/update-detail-attribute/:id', Controller.updateDetailAttribute)

Router.get('/list-category/:product_type_id', Controller.getCategories)

Router.get('/category-names', Controller.getDistinctCategoryNames)

Router.post('/add-categories/:product_type_id', Controller.addCategories)

Router.delete('/delete-category/:id', Controller.deleteCategory)

Router.put('/update-category/:id', Controller.updateCategory)

module.exports = Router