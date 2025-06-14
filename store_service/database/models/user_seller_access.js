const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const user_seller_access = sequelize.define('user_seller_access', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    store_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'stores',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: [['active', 'inactive', 'banned']],
        },
        comment: 'Trạng thái quyền truy cập (active, inactive, banned)'
    },
}, {
    tableName: 'user_seller_access',
    timestamps: true,
    indexes: [
        {
            fields: ['store_id']
        }
    ]
});

module.exports = user_seller_access;