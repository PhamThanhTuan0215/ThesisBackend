const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: {
                msg: "Email không hợp lệ"
            }
        }
    },
    fullname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: {
                args: [/^0[0-9]{9}$/],
                msg: "Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng 0"
            }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
        validate: {
            isIn: {
                args: [["active", "inactive", "banned"]],
                msg: "Status phải là active, inactive hoặc banned"
            }
        }
    }
}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;