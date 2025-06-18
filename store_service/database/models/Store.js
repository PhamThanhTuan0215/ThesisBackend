const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Store = sequelize.define('Store', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    owner_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    banner_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    province_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    province_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    district_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    district_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ward_code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ward_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address_detail: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    balance: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    tableName: 'stores',
    timestamps: true,
    indexes: [
        {
            fields: ['owner_id']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = Store;