const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/User');

Router.get('/', Controller.getAllUsers);

Router.get('/:id', Controller.getUserById);

Router.post('/register', Controller.register);

Router.post('/login', Controller.login);

Router.put('/', Controller.updateUser);

Router.delete('/:id', Controller.deleteUser);

Router.post('/:id/activate', Controller.activateUser);

Router.post('/:id/deactivate', Controller.deactivateUser);

Router.post('/change-password', Controller.changePassword);

module.exports = Router;