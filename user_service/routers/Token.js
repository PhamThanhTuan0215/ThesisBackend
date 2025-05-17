const express = require('express');
const Router = express.Router();
const Controller = require('../controllers/Token');
// const { authenticateToken } = require('../middlewares/auth');

// Refresh token endpoint - không cần authentication vì đây là endpoint để lấy token mới
Router.post('/refresh', Controller.refreshToken);

// Các endpoint dưới đây cần authentication
// Router.use(authenticateToken);

// Thu hồi một token cụ thể
Router.post('/revoke', Controller.revokeToken);

// Thu hồi tất cả token của user hiện tại
Router.post('/revoke-all', Controller.revokeAllTokens);

module.exports = Router;
