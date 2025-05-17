const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Settlement = sequelize.define('Settlement', {
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
    period: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Kỳ thanh toán (định dạng: MM-YYYY)'
    },
    total_revenue: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng doanh thu trong kỳ'
    },
    total_commission: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng phí hoa hồng'
    },
    total_refund: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng tiền hoàn trả'
    },
    net_payout: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Số tiền thực nhận (total_revenue - total_commission - total_refund)'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'processing', 'completed', 'failed']],
        },
        comment: 'Trạng thái thanh toán (pending, processing, completed, failed)'
    },
    payout_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Ngày thanh toán thực tế'
    }
}, {
    tableName: 'settlements',
    timestamps: true,
    indexes: [
        {
            fields: ['store_id']
        },
        {
            fields: ['period']
        },
        {
            fields: ['status']
        },
        {
            fields: ['payout_date']
        },
        {
            unique: true,
            fields: ['store_id', 'period'],
            name: 'unique_store_period'
        }
    ]
});

// Hook để tự động tính net_payout trước khi tạo hoặc cập nhật
Settlement.beforeSave(async (settlement) => {
    settlement.net_payout = parseFloat(settlement.total_revenue)
        - parseFloat(settlement.total_commission)
        - parseFloat(settlement.total_refund);
});

module.exports = Settlement;
