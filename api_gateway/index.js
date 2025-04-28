const express = require('express');
const app = express();
const PORT = 3000;
const cors = require('cors')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/product', proxy('http://localhost:3001'))
app.use('/user', proxy('http://localhost:3001'))

app.listen(PORT, () => {
    console.log("http://localhost:" + PORT);
});