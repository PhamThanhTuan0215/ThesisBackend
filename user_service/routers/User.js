const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/User');
const { authenticateToken } = require('../middlewares/auth');

Router.get('/', Controller.getAllCustomers);

Router.get('/:id', Controller.getUserById);

Router.post('/register', Controller.register);

Router.post('/registerSeller', Controller.registerSeller);

Router.post('/login', Controller.login);

Router.put('/', authenticateToken, Controller.updateUser);

Router.put('/editCustomer/:id', Controller.adminUpdateCustomer)

Router.delete('/:id', Controller.deleteUser);

Router.post('/:id/activate', Controller.activateUser);

Router.post('/:id/deactivate', Controller.deactivateUser);

Router.post('/change-password', authenticateToken, Controller.changePassword);

Router.post('/:id/update-avatar', Controller.uploadSingle, authenticateToken, Controller.updateAvatar);

Router.post('/forgot-password', authenticateToken, Controller.forgotPassword);

module.exports = Router;