const express = require('express');
const app = express();
const cors = require('cors')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser');

require('dotenv').config()
const {
    URL_API_GATEWAY,
    PORT, URL_PRODUCT_SERVICE,
    URL_USER_SERVICE,
    URL_CUSTOMER_SERVICE,
    URL_DISCOUNT_SERVICE,
    URL_ORDER_SERVICE,
    } = process.env

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    return res.status(200).json({ message: 'run api-gateway successfully' })
})
app.use('/product', proxy(URL_PRODUCT_SERVICE))
app.use('/user', proxy(URL_USER_SERVICE))
app.use('/customer', proxy(URL_CUSTOMER_SERVICE))
app.use('/discount', proxy(URL_DISCOUNT_SERVICE))
app.use('/order', proxy(URL_ORDER_SERVICE))

app.listen(PORT || 3000, () => {
    console.log('http://localhost:' + (PORT || 3000));
});