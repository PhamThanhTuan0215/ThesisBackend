const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Complaint')

Router.post('/add', Controller.createComplaint);

Router.get('/user', Controller.getComplaintsByUser);

Router.get('/', Controller.getAllComplaints);

Router.get('/:id', Controller.getComplaintById);

Router.put('/:id', Controller.updateComplaintById);

module.exports = Router