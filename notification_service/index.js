const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config()
const { PORT } = process.env

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const firebaseRoute = require("./routes/FirebaseRoute");

app.use("/notifications", firebaseRoute);

app.get('/', (req, res) => {
    return res.status(200).json({ code: 0, message: 'Run notification service successfully' })
})

app.listen(PORT, () => {
    console.log(`Notification service is running on port ${PORT}`)
})

module.exports = app;