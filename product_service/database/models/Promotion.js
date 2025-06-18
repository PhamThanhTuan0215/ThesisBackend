const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Promotion = sequelize.define('Promotion', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    seller_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    }, // ID của nhà bán tạo chương trình khuyến mãi
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }, // Tên chương trình khuyến mãi
    type: {
        type: DataTypes.ENUM('fixed', 'percent'),
        allowNull: false,
        defaultValue: 'percent'
    }, // Loại khuyến mãi: giảm giá cố định hoặc theo phần trăm
    value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    }, // Giá trị giảm giá
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    }, // Ngày bắt đầu
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    }, // Trạng thái hoạt động
}, {
    tableName: 'promotions'
});

module.exports = Promotion;