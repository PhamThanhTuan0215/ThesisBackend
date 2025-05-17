const Token = require('../database/models/Token');
const User = require('../database/models/User');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Create a new token
module.exports.createToken = async (userId, jti, expiresAt) => {
    try {
        const token = await Token.create({
            user_id: userId,
            jti: jti,
            expires_at: expiresAt
        });
        return token;
    } catch (error) {
        throw new Error('Error creating token: ' + error.message);
    }
};

// Revoke a specific token
module.exports.revokeToken = async (req, res) => {
    try {
        const { jti } = req.body;
        const userId = req.user.id;

        const token = await Token.findOne({
            where: {
                jti: jti,
                user_id: userId
            }
        });

        if (!token) {
            return res.status(404).json({ code: 1, message: 'Token không tồn tại' });
        }

        await token.update({ is_revoked: true });

        return res.status(200).json({ code: 0, message: 'Token đã được thu hồi thành công' });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Revoke all tokens for a user
module.exports.revokeAllTokens = async (req, res) => {
    try {
        const userId = req.user.id;

        await Token.update(
            { is_revoked: true },
            {
                where: {
                    user_id: userId,
                    is_revoked: false
                }
            }
        );

        return res.status(200).json({ code: 0, message: 'Tất cả token đã được thu hồi thành công' });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Check if a token is valid
module.exports.isTokenValid = async (jti) => {
    try {
        const token = await Token.findOne({
            where: {
                jti: jti,
                is_revoked: false,
                expires_at: {
                    [Op.gt]: new Date()
                }
            }
        });
        return !!token;
    } catch (error) {
        throw new Error('Error checking token validity: ' + error.message);
    }
};

// Refresh token
module.exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ code: 1, message: 'Refresh token is required' });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({ code: 1, message: 'Invalid refresh token' });
        }

        // Check if token exists and is valid in database
        const token = await Token.findOne({
            where: {
                user_id: decoded.id,
                jti: decoded.jti,
                is_revoked: false,
                expires_at: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!token) {
            return res.status(401).json({ code: 1, message: 'Refresh token has been revoked or expired' });
        }

        // Get user
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(404).json({ code: 1, message: 'User not found' });
        }

        // Generate new tokens
        const newAccessToken = jwt.sign(
            { id: user.id, type: 'access', role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const newRefreshToken = jwt.sign(
            { id: user.id, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Update token in database
        await token.update({
            token: newRefreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        return res.status(200).json({
            code: 0,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Server error', error: error.message });
    }
};

// Clean up expired tokens
module.exports.cleanupExpiredTokens = async () => {
    try {
        await Token.destroy({
            where: {
                [Op.or]: [
                    { expires_at: { [Op.lt]: new Date() } },
                    { is_revoked: true }
                ]
            }
        });
    } catch (error) {
        throw new Error('Error cleaning up expired tokens: ' + error.message);
    }
};
