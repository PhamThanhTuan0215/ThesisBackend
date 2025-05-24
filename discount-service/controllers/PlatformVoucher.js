const Voucher = require('../database/models/Voucher')
const VoucherUsage = require('../database/models/VoucherUsage')
const { generateRandomCode } = require('../units/GenerateRandomCode')

module.exports.getVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.findAll({
            where: {
                issuer_type: 'platform'
            },
            order: [
                ['updatedAt', 'DESC']
            ]
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách voucher thành công', data: vouchers });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách voucher thất bại', error: error.message });
    }
}

module.exports.getVoucherById = async (req, res) => {
    try {
        const { id } = req.params;

        const voucher = await Voucher.findByPk(id);

        if (!voucher) {
            return res.status(404).json({ code: 1, message: 'Voucher không tồn tại' });
        }

        if (voucher.issuer_type !== 'platform') {
            return res.status(404).json({ code: 1, message: 'Voucher không phải của hệ thống' });
        }

        return res.status(200).json({ code: 0, message: 'Xem chi tiết voucher thành công', data: voucher });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xem chi tiết voucher thất bại', error: error.message });
    }
}

module.exports.createVoucher = async (req, res) => {
    try {
        const {
            type,
            issuer_type,
            description,
            discount_unit,
            discount_value,
            max_discount_value,
            min_order_value,
            start_date,
            end_date,
        } = req.body;

        const errors = [];

        if (!type || type === '') errors.push('type cần cung cấp');
        if (!issuer_type || issuer_type === '') errors.push('issuer_type cần cung cấp');
        if (issuer_type !== 'platform') errors.push('issuer_type phải là platform');
        if (!description || description === '') errors.push('description cần cung cấp');
        if (!discount_unit || discount_unit === '') errors.push('discount_unit cần cung cấp');
        if (!discount_value || isNaN(discount_value) || discount_value < 0) errors.push('discount_value phải là số và lớn hơn hoặc bằng 0');

        if (isNaN(Date.parse(start_date)) || isNaN(Date.parse(end_date))) {
            errors.push('start_date và end_date phải là ngày hợp lệ');
        }
        else {
            if (new Date(start_date) > new Date(end_date)) errors.push('start_date phải trước end_date');
        }

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        let code;
        let isCodeUnique = false;

        while (!isCodeUnique) {
            code = generateRandomCode();

            const existingVoucer = await Voucher.findOne({ where: { code } });
            if (!existingVoucer) {
                isCodeUnique = true;
            }
        }

        const voucher = await Voucher.create({
            code,
            type,
            issuer_id: null,
            issuer_type,
            description,
            discount_unit,
            discount_value,
            max_discount_value,
            min_order_value,
            start_date,
            end_date
        });

        return res.status(201).json({ code: 0, message: 'Tạo voucher thành công', data: voucher });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Tạo voucher thất bại', error: error.message });
    }
}

module.exports.updateVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            description,
            discount_unit,
            discount_value,
            max_discount_value,
            min_order_value,
            start_date,
            end_date,
            is_active,
        } = req.body;

        const errors = [];

        if (!description || description === '') errors.push('description cần cung cấp');
        if (!discount_unit || discount_unit === '') errors.push('discount_unit cần cung cấp');
        if (!discount_value || isNaN(discount_value) || discount_value < 0) errors.push('discount_value phải là số và lớn hơn hoặc bằng 0');

        if (isNaN(Date.parse(start_date)) || isNaN(Date.parse(end_date))) {
            errors.push('start_date và end_date phải là ngày hợp lệ');
        }
        else {
            if (new Date(start_date) > new Date(end_date)) errors.push('start_date phải trước end_date');
        }

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const voucher = await Voucher.findByPk(id);

        if (!voucher) {
            return res.status(404).json({ code: 1, message: 'Voucher không tồn tại' });
        }

        if (voucher.issuer_type !== 'platform') {
            return res.status(404).json({ code: 1, message: 'Voucher không phải của hệ thống' });
        }

        const voucherUsage = await VoucherUsage.findOne({
            where: {
                voucher_id: id,
                is_applied: true,
            }
        });

        if (voucherUsage) {

            if (voucher.description !== description) {
                return res.status(400).json({ code: 1, message: 'Không thể cập nhật description của voucher đã được sử dụng' });
            }
            if (voucher.discount_unit !== discount_unit) {
                return res.status(400).json({ code: 1, message: 'Không thể cập nhật discount_unit của voucher đã được sử dụng' });
            }
            if (parseFloat(voucher.discount_value) !== parseFloat(discount_value)) {
                return res.status(400).json({ code: 1, message: 'Không thể cập nhật discount_value của voucher đã được sử dụng' });
            }
            if (voucher.max_discount_value === null) {
                if (max_discount_value !== null) {
                    return res.status(400).json({ code: 1, message: 'Không thể cập nhật max_discount_value của voucher đã được sử dụng' });
                }
            }
            else {
                if (parseFloat(voucher.max_discount_value) !== parseFloat(max_discount_value)) {
                    return res.status(400).json({ code: 1, message: 'Không thể cập nhật max_discount_value của voucher đã được sử dụng' });
                }
            }
            if (parseFloat(voucher.min_order_value) !== parseFloat(min_order_value)) {
                return res.status(400).json({ code: 1, message: 'Không thể cập nhật min_order_value của voucher đã được sử dụng' });
            }
            if (new Date(voucher.start_date).getTime() !== new Date(start_date).getTime()) {
                return res.status(400).json({ code: 1, message: 'Không thể cập nhật start_date của voucher đã được sử dụng' });
            }
        }

        await voucher.update({
            description,
            discount_unit,
            discount_value,
            max_discount_value,
            min_order_value,
            start_date,
            end_date,
            is_active,
        });

        return res.status(200).json({ code: 0, message: 'Cập nhật voucher thành công', data: voucher });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Cập nhật voucher thất bại', error: error.message });
    }
}

module.exports.deleteVoucher = async (req, res) => {
    try {
        const { id } = req.params;

        const voucher = await Voucher.findByPk(id);

        if (!voucher) {
            return res.status(404).json({ code: 1, message: 'Voucher không tồn tại' });
        }
        
        if (voucher.issuer_type !== 'platform') {
            return res.status(404).json({ code: 1, message: 'Voucher không phải của hệ thống' });
        }

        const voucherUsage = await VoucherUsage.findOne({
            where: {
                voucher_id: id,
                is_applied: true,
            }
        });

        if (voucherUsage) {
            return res.status(400).json({ code: 1, message: 'Không thể xóa voucher đã được sử dụng' });
        }

        await voucher.destroy();

        return res.status(200).json({ code: 0, message: 'Xóa voucher thành công', data: voucher });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa voucher thất bại', error: error.message });
    }
}
