const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    seller_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    total_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    original_items_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }, // tiền hàng gốc
    original_shipping_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }, // tiền vận chuyển gốc
    discount_amount_items: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }, // tiền hàng giảm từ shop
    discount_amount_shipping: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }, // tiền vận chuyển giảm từ shop
    discount_amount_items_platform_allocated: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }, // tiền hàng giảm từ sàn
    discount_amount_shipping_platform_allocated: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }, // tiền vận chuyển giảm từ sàn
    final_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }, // tiền thanh toán
    payment_method: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'COD',
        validate: {
            isIn: [['COD', 'VNPAY', 'MOMO']],
        },
    },
    payment_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PENDING',
        validate: {
            isIn: [['PENDING', 'PAID', 'CANCELLED']],
        },
    },
    order_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PENDING',
        validate: {
            isIn: [['PENDING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED']],
        },
    },
    payment_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    }, // id thanh toán
    shipment_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    } // id vận chuyển
}, {
    tableName: 'orders'
});

module.exports = Order;