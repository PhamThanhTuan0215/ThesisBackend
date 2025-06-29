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
        comment: 'ID đơn hàng gốc'
    },
    returned_order_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'ID đơn hàng trả về'
    },
    tracking_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Mã vận đơn'
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
    current_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'WAITING_FOR_PICKUP',
        comment: 'Trạng thái tổng vận đơn (Enum: SHIPPING_STATUS)'
    },
    progress: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Nhật ký quét mã (mỗi item gồm location, status, note, timestamp)'
    }
}, {
    tableName: 'shipments',
    timestamps: true,
    indexes: [
        {
            fields: ['order_id']
        },
        {
            fields: ['tracking_number']
        },
        {
            fields: ['current_status']
        }
    ]
});

module.exports = Shipment; 