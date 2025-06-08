const axios = require('axios');
require('dotenv').config()

const axiosGHN = axios.create({
    baseURL: 'https://online-gateway.ghn.vn/shiip/public-api',
    headers: {
        'Content-Type': 'application/json',
        'Token': process.env.TOKEN_GHN,
        'ShopId': process.env.SHOPID
    }
});

module.exports = axiosGHN;
