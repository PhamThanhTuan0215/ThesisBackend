const express = require('express');
const app = express();
const sequelize = require('./database/sequelize')
const bodyParser = require('body-parser');

require('dotenv').config()
const {PORT} = process.env

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    return res.status(200).json({code: 0, message: 'Run customer service successfully'})
})

app.use("/carts", require("./routers/Cart"))
app.use("/wishlists", require("./routers/Wishlist"))
app.use("/complaints", require("./routers/Complaint"))

sequelize.authenticate()
    .then(() => {
        console.log("Connect database server successfully")

        sequelize.sync()
            .then(() => {

                console.log('Database synchronized');

                app.listen(PORT || 3003, () => {
                    console.log("http://localhost:" + (PORT || 3003));
                });
            })
            .catch(err => {
                console.log("Error syncing database:", err.message);
                process.exit(1);
            });
    })
    .catch(err => {
        console.log("Can not connect database server: " + err.message)
        process.exit(1);
    });