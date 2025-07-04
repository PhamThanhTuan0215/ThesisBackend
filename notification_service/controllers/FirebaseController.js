const NotificationService = require("../service/NotificationService");

const sendNotification = async (req, res) => {
    const {
        target_id,
        target_type,
        title,
        body,
        store_id,
        data
    } = req.body;
    try {
        // Log the notification
        await NotificationService.logNotification(target_id, target_type, title, body, store_id, data);

        // Send the notification
        const response = await NotificationService.sendNotification(target_id, target_type, title, body, store_id, data);

        // Return the response
        return res.status(200).json({ code: 0, message: "Notification sent successfully", data: response });
    } catch (error) {
        return res.status(500).json({ code: 1, message: "Error sending notification", error: error.message });
    }
}

const getNotifications = async (req, res) => {
    const { target_id, target_type, store_id } = req.query;
    try {
        const notifications = await NotificationService.getNotifications(target_id ?? null, target_type, store_id ?? null);
        const total = await NotificationService.countUnreadNotifications(notifications);
        return res.status(200).json({ code: 0, message: "Fetched notifications successfully", data: notifications, total });
    } catch (error) {
        return res.status(500).json({ code: 1, message: "Error fetching notifications", error: error.message });
    }
};

const markAsRead = async (req, res) => {
    const { notificationId } = req.body;
    try {
        const result = await NotificationService.markAsRead(notificationId);
        return res.status(200).json({ code: 0, message: "Notification marked as read", data: result });
    } catch (error) {
        return res.status(500).json({ code: 1, message: "Error marking notification as read", error: error.message });
    }
};

const saveFcmToken = async (req, res) => {
    const { target_id, target_type, token, store_id } = req.body;
    try {
        const result = await NotificationService.saveFcmToken(target_id, target_type, token, store_id);
        return res.status(200).json({ code: 0, message: "FCM token saved successfully", data: result });
    } catch (error) {
        return res.status(500).json({ code: 1, message: "Error saving FCM token", error: error.message });
    }
};

module.exports = {
    sendNotification,
    getNotifications,
    markAsRead,
    saveFcmToken
};
