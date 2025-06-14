const UserSellerAccess = require('../database/models/user_seller_access');
const { Op } = require('sequelize');

// Validate dữ liệu user_seller_access
const validateAccessData = (data, isCreate = false) => {
    const errors = [];
    if (isCreate && (!data.store_id || !data.user_id)) {
        errors.push('store_id và user_id là bắt buộc');
    }
    if (data.status && !['active', 'inactive', 'banned'].includes(data.status)) {
        errors.push('Trạng thái không hợp lệ');
    }
    return errors;
};

// Tạo quyền truy cập mới
// Tạo mới một bản ghi user_seller_access
module.exports.createAccess = async (req, res) => {
    try {
        const data = req.body;
        const errors = validateAccessData(data, true);
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Dữ liệu không hợp lệ', errors });
        }
        const access = await UserSellerAccess.create(data);
        return res.status(201).json({ code: 0, message: 'Tạo quyền truy cập thành công', data: access });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Lấy danh sách quyền truy cập
// Có thể filter theo store_id, user_id, status, phân trang
module.exports.getAllAccesses = async (req, res) => {
    try {
        const { store_id, user_id, status, page = 1, limit = 10 } = req.query;
        const where = {};
        if (store_id) where.store_id = store_id;
        if (user_id) where.user_id = user_id;
        if (status) where.status = status;
        const offset = (page - 1) * limit;
        const result = await UserSellerAccess.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({
            code: 0,
            message: 'Lấy danh sách quyền truy cập thành công',
            data: {
                accesses: result.rows,
                total: result.count,
                totalPages: Math.ceil(result.count / limit),
                currentPage: parseInt(page)
            }
        });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Lấy thông tin quyền truy cập của store_id by user_id
module.exports.getAccessByUserId = async (req, res) => {
    try {
        const { user_id } = req.params;
        const access = await UserSellerAccess.findOne({ where: { user_id } });
        return res.status(200).json({ code: 0, message: 'Lấy thông tin quyền truy cập thành công', data: access });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Lấy thông tin một quyền truy cập
module.exports.getAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const access = await UserSellerAccess.findByPk(id);
        if (!access) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy quyền truy cập' });
        }
        return res.status(200).json({ code: 0, message: 'Lấy thông tin quyền truy cập thành công', data: access });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Cập nhật quyền truy cập
module.exports.updateAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData.id;
        const errors = validateAccessData(updateData, false);
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Dữ liệu không hợp lệ', errors });
        }
        const access = await UserSellerAccess.findByPk(id);
        if (!access) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy quyền truy cập' });
        }
        await access.update(updateData);
        return res.status(200).json({ code: 0, message: 'Cập nhật quyền truy cập thành công', data: await access.reload() });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
};

// Xóa quyền truy cập
module.exports.deleteAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const access = await UserSellerAccess.findByPk(id);
        if (!access) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy quyền truy cập' });
        }
        await access.destroy();
        return res.status(200).json({ code: 0, message: 'Xóa quyền truy cập thành công' });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
}; 