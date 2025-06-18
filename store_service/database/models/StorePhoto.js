const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const StorePhoto = sequelize.define('StorePhoto', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    store_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    photo_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'store_photos',
    timestamps: true,
});

module.exports = StorePhoto;