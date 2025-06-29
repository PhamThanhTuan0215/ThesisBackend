const express = require('express');
const Router = express.Router();

const ShipmentController = require('../controllers/Shipping');
const ShippingProviderController = require('../controllers/ShippingProvider');
const ShippingAddressController = require('../controllers/ShippingAddress');
const ShippingFeeController = require('../controllers/ShippingFee');

const authenticateToken = require('../middlewares/auth');

// Shipping Order (Shipment) Routes
Router.post('/shipping-orders', ShipmentController.createShippingOrder); // Tạo vận đơn mới
Router.get('/shipping-orders', ShipmentController.getShippingOrders); // Danh sách vận đơn
Router.get('/shipping-orders/order/:id', ShipmentController.getShippingOrderByOrderId); // Lấy chi tiết vận đơn theo order_id
Router.get('/shipping-orders/returned-order/:id', ShipmentController.getShippingOrderByReturnedOrderId); // Lấy chi tiết vận đơn theo returned_order_id
Router.get('/shipping-orders/:id', ShipmentController.getShippingOrderById); // Lấy chi tiết vận đơn
Router.post('/shipping-orders/:id/scan', ShipmentController.scanCheckpoint); // Quét mã checkpoint
Router.get('/shipping-orders/:id/progress', ShipmentController.getProgress); // Lấy progress
// Router.patch('/shipping-orders/:id/status', ShipmentController.updateStatus); // Cập nhật trạng thái tổng

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