const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

require('./Category')

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id'
        },
        onUpdate: 'CASCADE'
        // ko thiết lập onDelete: 'CASCADE' là để chặn việc cấp cha bị xóa nếu cấp hiện tại có chứa liên kết tới cấp cha
    },
}, {
    tableName: 'products', // TABLE_NAME
    timestamps: false
});

module.exports = Product;