const express = require('express');
const Router = express.Router();

const ShipmentController = require('../controllers/Shipping');
const ShippingProviderController = require('../controllers/ShippingProvider');
const ShippingAddressController = require('../controllers/ShippingAddress');
const ShippingFeeController = require('../controllers/ShippingFee');

const authenticateToken = require('../middlewares/auth');

// Shipment Routes
Router.get('/shipping', ShipmentController.getShipments);
Router.get('/shipping/:id', ShipmentController.getShipmentById);
Router.post('/shipping', ShipmentController.createShipment);
Router.put('/shipping/:id', ShipmentController.updateShipment);
Router.delete('/shipping/:id', ShipmentController.deleteShipment);

// Shipping Provider Routes
Router.get('/providers', ShippingProviderController.getShippingProviders);
Router.get('/providers/:id', ShippingProviderController.getShippingProviderById);
Router.post('/providers', ShippingProviderController.createShippingProvider);
Router.put('/providers/:id', ShippingProviderController.updateShippingProvider);
Router.delete('/providers/:id', ShippingProviderController.deleteShippingProvider);

// Shipping Address Routes
Router.get('/addresses', ShippingAddressController.getShippingAddresses);
Router.get('/addresses/:id', ShippingAddressController.getShippingAddressById);
Router.post('/addresses', ShippingAddressController.createShippingAddress);
Router.put('/addresses/:id', ShippingAddressController.updateShippingAddress);
Router.delete('/addresses/:id', ShippingAddressController.deleteShippingAddress);
Router.get('/addresses/set-default/:id', ShippingAddressController.setDefaultShippingAddress);

// Shipping fee Routes
Router.post('/shipping-fee', ShippingFeeController.calculateShippingFee); // tính phí vận chuyển từ các nhà bán tới khách hàng
Router.post('/return-shipping-fee', ShippingFeeController.calculateReturnShippingFee); // tính phí vận chuyển từ khách hàng về nhà bán

module.exports = Router;