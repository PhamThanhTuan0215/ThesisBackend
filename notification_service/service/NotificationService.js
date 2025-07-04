const admin = require("../utils/firebase");

class NotificationService {
    static async sendNotification(target_id, target_type, title, body, store_id = null, data = {}) {
        //target_type: 'customer', 'seller', 'shipper', 'flatform'
        // Lấy danh sách token từ collection fcm_token
        let tokenQuery = admin.firestore().collection('fcm_tokens').where('target_type', '==', target_type);
        if (target_id !== null && target_id !== undefined) {
            const parsedTargetId = parseInt(target_id);
            tokenQuery = tokenQuery.where('target_id', '==', parsedTargetId);
        }

        if (store_id !== null && store_id !== undefined) {
            const parsedStoreId = parseInt(store_id);
            tokenQuery = tokenQuery.where('store_id', '==', parsedStoreId);
        }
        const tokenSnapshot = await tokenQuery.get();
        const tokens = tokenSnapshot.docs.map(doc => doc.data().token).filter(Boolean);
        if (tokens.length === 0) {
            throw new Error('No device tokens found for the given target');
        }
        // Gửi notification đến tất cả token
        const messages = tokens.map(token => ({
            token: token,
            notification: {
                title: title,
                body: body
            }
        }));
        try {
            // Gửi notification hàng loạt
            const response = await admin.messaging().sendEach(messages);
            return response;
        } catch (error) {
            console.error("Error sending notification:", error);
            throw error;
        }
    }

    static async logNotification(target_id = null, target_type, title, body, store_id = null, data = {}) {
        target_id = target_id !== null && target_id !== undefined ? parseInt(target_id) : null;
        store_id = store_id !== null && store_id !== undefined ? parseInt(store_id) : null;
        return await admin.firestore().collection('notifications').add({
            target_id,
            target_type,
            title,
            body,
            store_id,
            data,
            is_read: false,
            created_at: new Date()
        });
    }

    static async getNotifications(target_id, target_type, store_id = null) {
        let query = admin.firestore().collection('notifications').where('target_type', '==', target_type);

        if (target_id !== null && target_id !== undefined) {
            const parsedTargetId = parseInt(target_id);
            query = query.where('target_id', '==', parsedTargetId);
        }
        if (store_id !== null && store_id !== undefined) {
            const parsedStoreId = parseInt(store_id);
            query = query.where('store_id', '==', parsedStoreId);
        }
        const snapshot = await query.orderBy('created_at', 'desc').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            let createdAtFormatted = data.created_at;
            if (createdAtFormatted && createdAtFormatted._seconds) {
                const date = new Date(createdAtFormatted._seconds * 1000);
                const pad = n => n < 10 ? '0' + n : n;
                createdAtFormatted = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
            }
            return { id: doc.id, ...data, created_at: createdAtFormatted };
        });
    }

    static async markAsRead(notificationId) {
        const notificationRef = admin.firestore().collection('notifications').doc(notificationId);
        await notificationRef.update({ is_read: true });
        return { id: notificationId, is_read: true };
    }

    static async saveFcmToken(target_id = null, target_type, token, store_id = null) {
        const fcmTokensRef = admin.firestore().collection('fcm_tokens');
        let query = fcmTokensRef.where('target_type', '==', target_type).where('token', '==', token);
        if (target_id !== null && target_id !== undefined) {
            const parsedTargetId = parseInt(target_id);
            query = query.where('target_id', '==', parsedTargetId);
        }
        if (store_id !== null && store_id !== undefined) {
            const parsedStoreId = parseInt(store_id);
            query = query.where('store_id', '==', parsedStoreId);
        }
        const snapshot = await query.get();
        if (!snapshot.empty) {
            // Đã tồn tại, cập nhật updated_at
            const docRef = snapshot.docs[0].ref;
            await docRef.update({ updated_at: new Date() });
            return { id: docRef.id, updated: true };
        } else {
            // Chưa có, tạo mới
            const doc = await fcmTokensRef.add({
                target_id: target_id !== null && target_id !== undefined ? parseInt(target_id) : null,
                target_type,
                token,
                store_id: store_id !== null && store_id !== undefined ? parseInt(store_id) : null,
                updated_at: new Date()
            });
            return { id: doc.id, created: true };
        }
    }

    static async countUnreadNotifications(notifications = null) {
        if (Array.isArray(notifications)) {
            return notifications.filter(n => n.is_read === false).length;
        }
        return 0;
    }
}

module.exports = NotificationService;