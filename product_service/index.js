const express = require('express');
const app = express();
const bodyParser = require('body-parser');

require('dotenv').config()
const {URL_PRODUCT_SERVICE, PORT} = process.env

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    return res.status(200).json({code: 0, message: 'Hello product service'})
})

app.listen(PORT || 3001, () => {
    console.log('http://localhost:' + (PORT || 3001));
});