const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Complaint')

Router.post('/add', Controller.createComplaint);    // user_id trong query

Router.get('/', Controller.getAllComplaints); // có thể truyền thêm user_id trong query để lọc theo 1 người dùng

Router.get('/:id', Controller.getComplaintById);

Router.put('/:id', Controller.responseComplaintById);

Router.delete('/:id', Controller.cancelComplaintById);

module.exports = Router