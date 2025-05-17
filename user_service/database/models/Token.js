const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

require('./User');

const Token = sequelize.define('Token', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    jti: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_revoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    tableName: 'tokens',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['jti'] // Đảm bảo jti là duy nhất
        },
        {
            fields: ['user_id'] // Tối ưu hóa tìm kiếm theo user_id
        }
    ]
});

module.exports = Token;