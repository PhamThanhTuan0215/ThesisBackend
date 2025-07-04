const express = require("express");
const { sendNotification, sendMultipleNotification, getNotifications, markAsRead, saveFcmToken } = require("../controllers/FirebaseController");

const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.post("/", sendNotification);

router.get("/", getNotifications);

router.post("/mark-as-read", markAsRead);

router.post("/save-fcm-token", saveFcmToken);

module.exports = router;