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
            isIn: {
                args: [['COD', 'VNPAY', 'MOMO']],
                msg: "payment_method phải là COD, VNPAY hoặc MOMO"
            }
        },
    },
    payment_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: {
                args: [['pending', 'paid']],
                msg: "payment_status phải là pending, paid hoặc cancelled"
            }
        },
    },
    order_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: {
                args: [['pending', 'processing', 'shipping', 'delivered', 'cancelled']],
                msg: "order_status phải là pending, processing, shipping, delivered hoặc cancelled"
            }
        },
    },
    is_completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

// trước khi lưu (thêm hoặc cập nhât) thì thiết lập is_completed = true nếu payment_status = paid và order_status = delivered
Order.beforeSave((order, options) => {
    order.is_completed = (order.payment_status === 'paid' && order.order_status === 'delivered');
});

module.exports = Order;