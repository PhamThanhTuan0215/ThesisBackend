const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const CartItem = sequelize.define('CartItem', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    cart_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    product_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    product_url_image: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    seller_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    seller_name: {
        type: DataTypes.STRING,
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
            fields: ['cart_id', 'product_id'],
        }
    ]
});

module.exports = CartItem;