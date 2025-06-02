const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Shipment = sequelize.define('Shipment', {
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
    shipping_provider_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'shipping_providers',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'ID nhà cung cấp vận chuyển'
    },
    shipping_address_from_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'ID địa chỉ gửi hàng'
    },
    shipping_address_to_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'ID địa chỉ nhận hàng'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Trạng thái vận chuyển (pending, shipped, delivered, cancelled)'
    },
    estimated_delivery: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Ngày dự kiến giao hàng'
    }
}, {
    tableName: 'shipments',
    timestamps: true,
    indexes: [
        {
            fields: ['order_id']
        },
        {
            fields: ['shipping_provider_id']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = Shipment; 