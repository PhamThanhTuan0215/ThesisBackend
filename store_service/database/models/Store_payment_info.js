const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Store_payment_info = sequelize.define('Store_payment_info', {
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
    method_type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Loại phương thức thanh toán (bank_transfer, momo, zalopay, ...)'
    },
    account_number: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Số tài khoản hoặc số điện thoại (đối với ví điện tử)'
    },
    account_name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Tên chủ tài khoản'
    },
    bank_name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Tên ngân hàng (chỉ áp dụng cho phương thức chuyển khoản)'
    },
    qr_code_url: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL hình ảnh mã QR (nếu có)'
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Đánh dấu phương thức thanh toán mặc định'
    }
}, {
    tableName: 'store_payment_infos',
    timestamps: true,
    indexes: [
        {
            fields: ['store_id']
        },
        {
            fields: ['method_type']
        },
        {
            fields: ['is_default']
        }
    ]
});

module.exports = Store_payment_info;
