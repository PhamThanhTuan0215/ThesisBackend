const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Voucher = sequelize.define('Voucher', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: {
                args: [['order', 'freeship']],
                msg: "type phải là order hoặc freeship"
            }
        }
    },
    issuer_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: {
                args: [['platform', 'shop']],
                msg: "issuer_type phải là platform hoặc shop"
            }
        }
    },
    issuer_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    discount_unit: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: {
                args: [['amount', 'percent']],
                msg: "discount_unit phải là amount hoặc percent"
            }
        }
    },
    discount_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    max_discount_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0
        }
    },
    min_order_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'vouchers'
});

module.exports = Voucher;