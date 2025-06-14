const WithdrawRequests = require('../database/models/withdraw_requests');
const { Op } = require('sequelize');

// Validate dữ liệu withdraw_requests
const validateWithdrawData = (data, isCreate = false) => {
    const errors = [];
    if (isCreate) {
        if (!data.store_id) errors.push('store_id là bắt buộc');
        if (!data.amount || data.amount <= 0) errors.push('Số tiền rút phải lớn hơn 0');
        if (!data.store_payment_info_id) errors.push('store_payment_info_id là bắt buộc');
    }
    if (data.status && !['processing', 'completed', 'failed'].includes(data.status)) {
        errors.push('Trạng thái không hợp lệ');
    }
    return errors;
};

// Tạo yêu cầu rút tiền mới
module.exports.createWithdrawRequest = async (req, res) => {
    try {
        const data = req.body;
        const errors = validateWithdrawData(data, true);
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Dữ liệu không hợp lệ', errors });
        }
        const request = await WithdrawRequests.create(data);
        return res.status(201).json({ code: 0, message: 'Tạo yêu cầu rút tiền thành công', data: request });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Lấy danh sách yêu cầu rút tiền
// Có thể filter theo store_id, status, phân trang
module.exports.getAllWithdrawRequests = async (req, res) => {
    try {
        const { store_id, status, page = 1, limit = 10 } = req.query;
        const where = {};
        if (store_id) where.store_id = store_id;
        if (status) where.status = status;
        const offset = (page - 1) * limit;
        const result = await WithdrawRequests.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({
            code: 0,
            message: 'Lấy danh sách yêu cầu rút tiền thành công',
            data: {
                requests: result.rows,
                total: result.count,
                totalPages: Math.ceil(result.count / limit),
                currentPage: parseInt(page)
            }
        });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Lấy thông tin một yêu cầu rút tiền
module.exports.getWithdrawRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await WithdrawRequests.findByPk(id);
        if (!request) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy yêu cầu rút tiền' });
        }
        return res.status(200).json({ code: 0, message: 'Lấy thông tin yêu cầu rút tiền thành công', data: request });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Cập nhật yêu cầu rút tiền
module.exports.updateWithdrawRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData.id;
        const errors = validateWithdrawData(updateData, false);
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Dữ liệu không hợp lệ', errors });
        }
        const request = await WithdrawRequests.findByPk(id);
        if (!request) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy yêu cầu rút tiền' });
        }
        await request.update(updateData);
        return res.status(200).json({ code: 0, message: 'Cập nhật yêu cầu rút tiền thành công', data: await request.reload() });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Cập nhật status yêu cầu rút tiền theo id
module.exports.updateWithdrawRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData.id;
        const request = await WithdrawRequests.findByPk(id);
        if (!request) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy yêu cầu rút tiền' });
        }
        await request.update(updateData);
        return res.status(200).json({ code: 0, message: 'Cập nhật yêu cầu rút tiền thành công', data: await request.reload() });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Xóa yêu cầu rút tiền
module.exports.deleteWithdrawRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await WithdrawRequests.findByPk(id);
        if (!request) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy yêu cầu rút tiền' });
        }
        await request.destroy();
        return res.status(200).json({ code: 0, message: 'Xóa yêu cầu rút tiền thành công' });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
}; 