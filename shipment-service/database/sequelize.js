const { Sequelize } = require('sequelize');
require('dotenv').config()

const sequelize = new Sequelize(process.env.URI_SHIPMENT_SERVICE_DATABASE, {
    dialect: 'postgres',
    logging: false,
});

module.exports = sequelize;