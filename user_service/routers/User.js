const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/User');
const { authenticateToken } = require('../middlewares/auth');

Router.get('/', Controller.getAllAccounts);

Router.get('/info/:id', Controller.getInfoUser);

Router.get('/:id', Controller.getUserById);

Router.post('/register', Controller.register);

Router.post('/registerSeller', Controller.registerSeller);

Router.post('/login', Controller.login);

Router.put('/', authenticateToken, Controller.updateUser);

Router.put('/account/:id', Controller.adminUpdateAccount);

Router.post('/account', Controller.adminCreateAccount);

Router.delete('/:id', Controller.deleteUser);

Router.post('/:id/activate', Controller.activateUser);

Router.post('/:id/deactivate', Controller.deactivateUser);

Router.post('/change-password', authenticateToken, Controller.changePassword);

Router.post('/:id/update-avatar', Controller.uploadSingle, authenticateToken, Controller.updateAvatar);

Router.post('/forgot-password', authenticateToken, Controller.forgotPassword);

module.exports = Router;