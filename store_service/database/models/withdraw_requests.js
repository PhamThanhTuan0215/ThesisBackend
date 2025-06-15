const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const withdraw_requests = sequelize.define('withdraw_requests', {
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
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số tiền yêu cầu rút (đơn vị: đồng)',
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'processing',
        validate: {
            isIn: [['processing', 'completed', 'failed']],
        },
        comment: 'Trạng thái yêu cầu rút tiền (processing, completed, failed)',
    },
    store_payment_info_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'store_payment_infos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
}, {
    tableName: 'withdraw_requests',
    timestamps: true,
    indexes: [
        {
            fields: ['store_id']
        }
    ]
});

module.exports = withdraw_requests;