const Voucher = require('../database/models/Voucher')
const VoucherUsage = require('../database/models/VoucherUsage')
const { Op } = require('sequelize')

module.exports.getPlatformVouchersAvailable = async (req, res) => {
    try {
        const { user_id } = req.query;
        const { type } = req.query;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const voucherUsages = await VoucherUsage.findAll({
            where: {
                user_id: user_id,
                is_applied: true
            },
            attributes: ['voucher_id']
        });

        const voucherIds = voucherUsages.map(voucherUsage => voucherUsage.voucher_id);

        const conditions = {
            issuer_type: 'platform',
            start_date: {
                [Op.lte]: new Date()
            },
            end_date: {
                [Op.gte]: new Date()
            },
            is_active: true,
            id: {
                [Op.notIn]: voucherIds
            }
        }

        if (type) conditions.type = type;

        const vouchers = await Voucher.findAll({
            where: conditions,
            order: [
                ['updatedAt', 'DESC']
            ]
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách voucher khả dụng của sàn thành công', data: vouchers });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách voucher khả dụng của sàn thất bại', error: error.message });
    }
}

module.exports.getShopVouchersAvailable = async (req, res) => {
    try {
        const { user_id } = req.query;
        const { type } = req.query;
        const { seller_id } = req.params;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!seller_id || seller_id <= 0) errors.push('seller_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const voucherUsages = await VoucherUsage.findAll({
            where: {
                user_id: user_id,
                is_applied: true
            },
            attributes: ['voucher_id']
        });

        const voucherIds = voucherUsages.map(voucherUsage => voucherUsage.voucher_id);

        const conditions = {
            issuer_type: 'shop',
            start_date: {
                [Op.lte]: new Date()
            },
            end_date: {
                [Op.gte]: new Date()
            },
            is_active: true,
            issuer_id: seller_id,
            id: {
                [Op.notIn]: voucherIds
            }
        }

        if (type) conditions.type = type;

        const vouchers = await Voucher.findAll({
            where: conditions,
            order: [
                ['updatedAt', 'DESC']
            ]
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách voucher khả dụng của cửa hàng thành công', data: vouchers });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách voucher khả dụng của cửa hàng thất bại', error: error.message });
    }
}

module.exports.applyVoucher = async (req, res) => {
    try {
        

    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Áp dụng voucher thất bại', error: error.message });
    }
}

module.exports.saveVoucherUsage = async (req, res) => {
    try {
        

    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lưu lại voucher đã áp dụng thất bại', error: error.message });
    }
}

module.exports.restoreVoucherUsage = async (req, res) => {
    try {
        

    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Hoàn lại voucher đã áp dụng thất bại', error: error.message });
    }
}