const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/User');
const { authenticateToken } = require('../middlewares/auth');

Router.get('/', Controller.getAllCustomers);

Router.get('/:id', authenticateToken, Controller.getUserById);

Router.post('/register', Controller.register);

Router.post('/login', Controller.login);

Router.put('/', authenticateToken, Controller.updateUser);

Router.delete('/:id', authenticateToken, Controller.deleteUser);

Router.post('/:id/activate', authenticateToken, Controller.activateUser);

Router.post('/:id/deactivate', authenticateToken, Controller.deactivateUser);

Router.post('/change-password', authenticateToken, Controller.changePassword);

Router.post('/:id/update-avatar', Controller.uploadSingle, authenticateToken, Controller.updateAvatar);

module.exports = Router;