const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

require('./User');

const UserRole = sequelize.define('UserRole', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    store_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    }
}, {
    tableName: 'user_roles',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id']
        }
    ]
});

module.exports = UserRole;