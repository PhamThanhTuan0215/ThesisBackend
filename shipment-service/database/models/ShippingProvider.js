const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const ShippingProvider = sequelize.define('ShippingProvider', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Tên nhà cung cấp vận chuyển'
    },
    tracking_url: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL tra cứu vận đơn'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
        comment: 'Trạng thái nhà cung cấp (active, inactive)'
    }
}, {
    tableName: 'shipping_providers',
    timestamps: true,
    indexes: [
        {
            fields: ['name']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = ShippingProvider; 