const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Complaint = sequelize.define('Complaint', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    
}, {
    tableName: 'complaints'
});

module.exports = Complaint;