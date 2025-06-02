const jwt = require('jsonwebtoken');
const TokenController = require('../controllers/Token');
const User = require('../database/models/User');

module.exports.authenticateToken = async (req, res, next) => {
    try {
        // Lấy token từ header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                code: 1,
                message: 'Access token không được cung cấp'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Kiểm tra loại token
            if (decoded.type !== 'access') {
                return res.status(401).json({
                    code: 1,
                    message: 'Token không hợp lệ'
                });
            }

            // Kiểm tra token có bị thu hồi không (nếu có jti)
            if (decoded.jti) {
                const isValid = await TokenController.isTokenValid(decoded.jti);
                if (!isValid) {
                    return res.status(401).json({
                        code: 1,
                        message: 'Token đã bị thu hồi'
                    });
                }
            }

            // Lấy role của user từ model User
            const user = await User.findOne({ where: { id: decoded.id } });
            const role = user ? user.role : 'customer';

            // Lưu thông tin user vào request
            req.user = {
                id: decoded.id,
                role: role,
                jti: decoded.jti
            };

            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    code: 1,
                    message: 'Token đã hết hạn'
                });
            }

            return res.status(401).json({
                code: 1,
                message: 'Token không hợp lệ'
            });
        }
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Middleware kiểm tra role admin hệ thống hoặc staff hệ thống
module.exports.requireAdmin = (req, res, next) => {
    if (req.user && ['admin_system', 'staff_system'].includes(req.user.role)) {
        next();
    } else {
        return res.status(403).json({
            code: 1,
            message: 'Bạn không có quyền thực hiện hành động này'
        });
    }
};

// Middleware kiểm tra user đã đăng nhập
module.exports.requireUser = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        return res.status(403).json({
            code: 1,
            message: 'Bạn cần đăng nhập để thực hiện hành động này'
        });
    }
};

// Middleware kiểm tra role cụ thể
module.exports.requireRole = (role) => {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            return res.status(403).json({
                code: 1,
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }
    };
};

// Middleware kiểm tra nhiều role
module.exports.requireRoles = (roles) => {
    return (req, res, next) => {
        if (req.user && roles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({
                code: 1,
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }
    };
}; 