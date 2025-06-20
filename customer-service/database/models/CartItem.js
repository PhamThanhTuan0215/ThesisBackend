const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const CartItem = sequelize.define('CartItem', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    }
}, {
    tableName: 'cart_items',
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'product_id'],
        }
    ]
});

module.exports = CartItem;