const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'ID đơn hàng từ service khác'
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'ID người dùng từ service khác'
    },
    payment_method_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'payment_methods',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Số tiền thanh toán'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Trạng thái thanh toán (pending, completed, failed, cancelled)'
    }
}, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
        {
            fields: ['order_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['payment_method_id']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = Payment;