const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const WishlistItem = sequelize.define('WishlistItem', {
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
    }
}, {
    tableName: 'wishlist_items',
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'product_id']
        }
    ]
});

module.exports = WishlistItem;