const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const ShippingAddress = sequelize.define('ShippingAddress', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    address_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Nhà riêng',
        comment: 'Tên địa chỉ' // Nhà riêng, Văn phòng, ...
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'ID người dùng'
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Họ tên người nhận'
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Số điện thoại người nhận'
    },
    province_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID tỉnh/thành phố'
    },
    province_name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Tên tỉnh/thành phố'
    },
    district_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID quận/huyện'
    },
    district_name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Tên quận/huyện'
    },
    ward_code: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Mã phường/xã'
    },
    ward_name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Tên phường/xã'
    },
    address_detail: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Địa chỉ chi tiết'
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Địa chỉ mặc định'
    }
}, {
    tableName: 'shipping_addresses',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['is_default']
        }
    ]
});

module.exports = ShippingAddress; 