const Complaint = require('../database/models/Complaint')
const { Op } = require('sequelize');

module.exports.createComplaint = async (req, res) => {
    try {
        const { user_id } = req.query;
        const { subject, message } = req.body;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!subject || subject === '') errors.push('subject cần cung cấp');
        if (!message || message === '') errors.push('message cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const complaint = await Complaint.create({
            user_id,
            subject,
            message
        });

        return res.status(200).json({ code: 0, message: 'Gửi phàn nàn thành công', data: complaint });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Gửi phàn nàn thất bại', error: error.message });
    }
}

module.exports.getAllComplaints = async (req, res) => {
    try {
        const { user_id, status, startDate, endDate } = req.query;

        let selectedStartDate = undefined
        let selectedEndDate = undefined

        if (startDate && endDate) {
            const isValidStartDate = /^\d{4}-\d{2}-\d{2}$/.test(startDate);
            const isValidEndDate = /^\d{4}-\d{2}-\d{2}$/.test(endDate);

            if (!isValidStartDate || !isValidEndDate) {
                return res.status(400).json({ code: 1, message: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng: yyyy-mm-dd.' });
            }

            selectedStartDate = new Date(startDate);
            selectedStartDate.setHours(0, 0, 0, 0); // 00:00:00

            selectedEndDate = new Date(endDate);
            selectedEndDate.setHours(23, 59, 59, 999); // 23:59:59.999
        }

        const conditions = {};

        if (user_id) {
            conditions.user_id = user_id;
        }

        if (status) {
            conditions.status = status;
        }

        if (selectedStartDate && selectedEndDate) {
            conditions.createdAt = {
                [Op.between]: [selectedStartDate, selectedEndDate]
            };
        }

        const complaints = await Complaint.findAll({
            where: conditions,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách phàn nàn thành công', data: complaints });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách phàn nàn thất bại', error: error.message });
    }
}

module.exports.getComplaintById = async (req, res) => {
    try {
        const { id } = req.params;

        const errors = [];

        if (!id || id <= 0) errors.push('id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const complaint = await Complaint.findByPk(id);

        if(!complaint) {
            return res.status(404).json({ code: 1, message: 'Phàn nàn không tồn tại' });
        }

        return res.status(200).json({ code: 0, message: 'Xem chi tiết phàn nàn thành công', data: complaint });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xem chi tiết phàn nàn thất bại', error: error.message });
    }
}

module.exports.responseComplaintById = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response } = req.body;

        const errors = [];

        if (!id || id <= 0) errors.push('id cần cung cấp');
        if (!status || status === '') errors.push('status cần cung cấp');
        if (!response || response === '') errors.push('response cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const [affectedRows, updatedRows] = await Complaint.update(
            { status, response },
            { where: { id }, returning: true }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ code: 1, message: 'Phàn nàn không tồn tại hoặc không bị thay đổi' });
        }

        return res.status(200).json({ code: 0, message: 'Phản hồi phàn nàn thành công', data: updatedRows[0] });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Phản hồi phàn nàn thất bại', error: error.message });
    }
}

module.exports.cancelComplaintById = async (req, res) => {
        try {
        const { id } = req.params;

        const errors = [];

        if (!id || id <= 0) errors.push('id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const complaint = await Complaint.findByPk(id);

        if(!complaint) {
            return res.status(404).json({ code: 1, message: 'Phàn nàn không tồn tại' });
        }

        if(complaint.status !== 'pending') {
            return res.status(400).json({ code: 1, message: 'Không thể hủy phàn nàn đã giải quyết' });
        }

        await complaint.destroy()

        return res.status(200).json({ code: 0, message: 'Hủy phàn nàn thành công', data: complaint });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Hủy phàn nàn thất bại', error: error.message });
    }
}