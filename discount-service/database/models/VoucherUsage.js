const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const VoucherUsage = sequelize.define('VoucherUsage', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    voucher_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'vouchers',
            key: 'id'
        },
        onUpdate: 'CASCADE'
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    usage_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    is_applied: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }
}, {
    tableName: 'voucher_usages'
});

module.exports = VoucherUsage;