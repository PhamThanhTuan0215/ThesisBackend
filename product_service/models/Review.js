const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    comment: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
    }
}, {
    tableName: 'reviews',
    timestamps: false,
});

module.exports = Review;