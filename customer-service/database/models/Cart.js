const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Cart = sequelize.define('Cart', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true, // mỗi user có 1 giỏ hàng
    },
    total_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    total_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
}, {
    tableName: 'carts'
});

module.exports = Cart;