const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Complaint = sequelize.define('Complaint', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: {
                args: [["pending", "resolved", "rejected"]],
                msg: "status phải là pending, resolved hoặc rejected"
            }
        }
    },
    response: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'complaints'
});

module.exports = Complaint;