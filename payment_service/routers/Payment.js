const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Payment')

// Payment Methods Routes
Router.get('/methods', Controller.getPaymentMethods);
Router.post('/methods', Controller.createPaymentMethod);
Router.put('/methods/:id', Controller.updatePaymentMethod);
Router.delete('/methods/:id', Controller.deletePaymentMethod);

// Payment History Routes
Router.get('/history', Controller.getPaymentHistory);
Router.get('/user/:user_id/history', Controller.getUserPaymentHistory);
Router.get('/:id', Controller.getPaymentDetails);

// Payment Creation Routes
Router.post('/', Controller.createPayment);
Router.post('/cod', Controller.createCODPayment);
Router.post('/vnpay/create_payment_url', Controller.VNPay);

// Payment Status Update Routes
Router.patch('/:id/status', Controller.updatePaymentStatus);
Router.patch('/cod/:id/status', Controller.updateCODPaymentStatus);

// VNPay Return URL
Router.get("/vnpay/vnpay_return", Controller.VNPayReturn);

module.exports = Router