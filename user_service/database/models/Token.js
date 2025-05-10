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
    token: {
        type: DataTypes.STRING,
        allowNull: false,
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
            fields: ['token'] // Đảm bảo token là duy nhất
        },
        {
            fields: ['user_id'] // Tối ưu hóa tìm kiếm theo user_id
        }
    ]
});

module.exports = Token;