const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const StoreLicense = sequelize.define('StoreLicense', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    store_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    license_type: {
        type: DataTypes.STRING, // Ví dụ: 'BUSINESS_REGISTRATION', 'PHARMACIST_CERTIFICATE', 'PHARMACY_OPERATION_CERTIFICATE', 'GPP_CERTIFICATE'
        enum: ['BUSINESS_REGISTRATION', 'PHARMACIST_CERTIFICATE', 'PHARMACY_OPERATION_CERTIFICATE', 'GPP_CERTIFICATE'],
        allowNull: false,
    },
    license_number: {
        type: DataTypes.STRING,
        allowNull: true, // số giấy phép
    },
    license_url: {
        type: DataTypes.STRING,
        allowNull: false, // link ảnh scan
    },
    issued_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    expired_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING, // pending/approved/rejected/expired
        allowNull: false,
        defaultValue: 'pending',
    }
}, {
    tableName: 'store_licenses',
    timestamps: true,
    indexes: [
        { fields: ['store_id'] },
        { fields: ['license_type'] },
    ]
});

module.exports = StoreLicense;