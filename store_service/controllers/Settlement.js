const Settlement = require('../database/models/Settlement');
const Store = require('../database/models/Store');
const { Op } = require('sequelize');
const sendMail = require("../configs/sendMail.js");

// Validate dữ liệu thanh toán
const validateSettlementData = (data, isCreate = false) => {
    const errors = [];

    if (isCreate) {
        if (!data.store_id) errors.push('store_id là bắt buộc');
        if (!data.period) errors.push('Kỳ thanh toán là bắt buộc');
    }

    if (data.period && !/^(0[1-9]|1[0-2])-\d{4}$/.test(data.period)) {
        errors.push('Kỳ thanh toán phải theo định dạng MM-YYYY');
    }

    if (data.status && !['pending', 'processing', 'completed', 'failed'].includes(data.status)) {
        errors.push('Trạng thái không hợp lệ');
    }

    // Kiểm tra số tiền
    const numericFields = ['total_revenue', 'total_commission', 'total_refund'];
    numericFields.forEach(field => {
        if (data[field] !== undefined) {
            if (isNaN(parseFloat(data[field])) || parseFloat(data[field]) < 0) {
                errors.push(`${field} phải là số và lớn hơn hoặc bằng 0`);
            }
        }
    });

    return errors;
};

// Tạo kỳ thanh toán mới
module.exports.createSettlement = async (req, res) => {
    try {
        const settlementData = { ...req.body };

        // Validate dữ liệu
        const validationErrors = validateSettlementData(settlementData, true);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                code: 1,
                message: 'Dữ liệu không hợp lệ',
                errors: validationErrors
            });
        }

        // Kiểm tra xem store có tồn tại không
        const store = await Store.findByPk(settlementData.store_id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        // Kiểm tra kỳ thanh toán đã tồn tại chưa
        const existingSettlement = await Settlement.findOne({
            where: {
                store_id: settlementData.store_id,
                period: settlementData.period
            }
        });

        if (existingSettlement) {
            return res.status(400).json({
                code: 1,
                message: 'Kỳ thanh toán này đã tồn tại cho cửa hàng'
            });
        }

        // Tạo kỳ thanh toán
        const settlement = await Settlement.create(settlementData);

        // Thông báo cho cửa hàng
        await sendMail({
            to: store.email,
            subject: `Thông báo kỳ thanh toán ${settlementData.period}`,
            html: `
                <h2>Thông báo kỳ thanh toán mới</h2>
                <p>Cửa hàng: <strong>${store.name}</strong></p>
                <p>Kỳ thanh toán: <strong>${settlementData.period}</strong></p>
                <p>Tổng doanh thu: <strong>${settlementData.total_revenue}</strong></p>
                <p>Tổng hoa hồng: <strong>${settlementData.total_commission}</strong></p>
                <p>Tổng hoàn tiền: <strong>${settlementData.total_refund}</strong></p>
                <p>Số tiền thực nhận: <strong>${settlement.net_payout}</strong></p>
                <p>Trạng thái: <strong>${settlement.status}</strong></p>
                <p>Vui lòng đăng nhập vào hệ thống để biết thêm chi tiết.</p>
            `
        });

        return res.status(201).json({
            code: 0,
            message: 'Tạo kỳ thanh toán thành công',
            data: settlement
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Lấy thông tin một kỳ thanh toán
module.exports.getSettlement = async (req, res) => {
    try {
        const { id } = req.params;
        const settlement = await Settlement.findByPk(id);

        if (!settlement) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy kỳ thanh toán'
            });
        }

        return res.status(200).json({
            code: 0,
            message: 'Lấy thông tin kỳ thanh toán thành công',
            data: settlement
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Lấy danh sách kỳ thanh toán của một cửa hàng
module.exports.getStoreSettlements = async (req, res) => {
    try {
        const { store_id } = req.params;
        const { status, period, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Kiểm tra xem store có tồn tại không
        const storeExists = await Store.findByPk(store_id);
        if (!storeExists) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        const whereClause = { store_id };
        if (status) {
            whereClause.status = status;
        }
        if (period) {
            whereClause.period = period;
        }

        const settlements = await Settlement.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['period', 'DESC']]
        });

        return res.status(200).json({
            code: 0,
            message: 'Lấy danh sách kỳ thanh toán thành công',
            data: {
                settlements: settlements.rows,
                total: settlements.count,
                totalPages: Math.ceil(settlements.count / limit),
                currentPage: parseInt(page)
            }
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Lấy danh sách tất cả kỳ thanh toán
module.exports.getAllSettlements = async (req, res) => {
    try {
        const { status, period, store_id, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (period) {
            whereClause.period = period;
        }
        if (store_id) {
            whereClause.store_id = store_id;
        }

        const settlements = await Settlement.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['period', 'DESC']],
            include: [
                {
                    model: Store,
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        return res.status(200).json({
            code: 0,
            message: 'Lấy danh sách kỳ thanh toán thành công',
            data: {
                settlements: settlements.rows,
                total: settlements.count,
                totalPages: Math.ceil(settlements.count / limit),
                currentPage: parseInt(page)
            }
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật thông tin kỳ thanh toán
module.exports.updateSettlement = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Không cho phép cập nhật store_id và period (khoá chính)
        delete updateData.store_id;
        delete updateData.period;

        // Validate dữ liệu cập nhật
        const validationErrors = validateSettlementData(updateData, false);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                code: 1,
                message: 'Dữ liệu không hợp lệ',
                errors: validationErrors
            });
        }

        const settlement = await Settlement.findByPk(id);
        if (!settlement) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy kỳ thanh toán'
            });
        }

        await settlement.update(updateData);

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật thông tin kỳ thanh toán thành công',
            data: await settlement.reload()
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật trạng thái kỳ thanh toán
module.exports.updateSettlementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['pending', 'processing', 'completed', 'failed'].includes(status)) {
            return res.status(400).json({
                code: 1,
                message: 'Trạng thái không hợp lệ'
            });
        }

        const settlement = await Settlement.findByPk(id, {
            include: [
                {
                    model: Store,
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        if (!settlement) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy kỳ thanh toán'
            });
        }

        const oldStatus = settlement.status;
        let updateData = { status };

        // Nếu trạng thái là completed, thêm ngày thanh toán
        if (status === 'completed' && oldStatus !== 'completed') {
            updateData.payout_date = new Date();
        }

        await settlement.update(updateData);

        // Gửi email thông báo khi trạng thái thay đổi
        if (oldStatus !== status && settlement.Store) {
            await sendMail({
                to: settlement.Store.email,
                subject: `Cập nhật trạng thái kỳ thanh toán ${settlement.period}`,
                html: `
                    <h2>Thông báo cập nhật trạng thái kỳ thanh toán</h2>
                    <p>Cửa hàng: <strong>${settlement.Store.name}</strong></p>
                    <p>Kỳ thanh toán: <strong>${settlement.period}</strong></p>
                    <p>Trạng thái mới: <strong>${status}</strong></p>
                    <p>Số tiền thực nhận: <strong>${settlement.net_payout}</strong></p>
                    ${status === 'completed' ? `<p>Ngày thanh toán: <strong>${updateData.payout_date}</strong></p>` : ''}
                    <p>Vui lòng đăng nhập vào hệ thống để biết thêm chi tiết.</p>
                `
            });
        }

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật trạng thái kỳ thanh toán thành công',
            data: await settlement.reload()
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Xóa kỳ thanh toán
module.exports.deleteSettlement = async (req, res) => {
    try {
        const { id } = req.params;

        const settlement = await Settlement.findByPk(id);
        if (!settlement) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy kỳ thanh toán'
            });
        }

        // Không cho phép xóa kỳ thanh toán đã hoàn thành
        if (settlement.status === 'completed') {
            return res.status(400).json({
                code: 1,
                message: 'Không thể xóa kỳ thanh toán đã hoàn thành'
            });
        }

        await settlement.destroy();

        return res.status(200).json({
            code: 0,
            message: 'Xóa kỳ thanh toán thành công'
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Tạo đợt thanh toán hàng loạt theo kỳ
module.exports.createBulkSettlements = async (req, res) => {
    try {
        const { period, stores } = req.body;

        if (!period || !/^(0[1-9]|1[0-2])-\d{4}$/.test(period)) {
            return res.status(400).json({
                code: 1,
                message: 'Kỳ thanh toán không hợp lệ, phải theo định dạng MM-YYYY'
            });
        }

        if (!stores || !Array.isArray(stores) || stores.length === 0) {
            return res.status(400).json({
                code: 1,
                message: 'Danh sách cửa hàng không hợp lệ'
            });
        }

        // Lọc những cửa hàng hợp lệ
        const validStores = await Store.findAll({
            where: {
                id: { [Op.in]: stores },
                status: 'active'
            }
        });

        if (validStores.length === 0) {
            return res.status(400).json({
                code: 1,
                message: 'Không có cửa hàng hợp lệ trong danh sách'
            });
        }

        // Kiểm tra xem đã có kỳ thanh toán nào cho cửa hàng trong kỳ này chưa
        const existingSettlements = await Settlement.findAll({
            where: {
                store_id: { [Op.in]: validStores.map(store => store.id) },
                period
            }
        });

        const existingStoreIds = existingSettlements.map(s => s.store_id);
        const newStores = validStores.filter(store => !existingStoreIds.includes(store.id));

        if (newStores.length === 0) {
            return res.status(400).json({
                code: 1,
                message: 'Tất cả cửa hàng đã có kỳ thanh toán cho kỳ này'
            });
        }

        // Tạo kỳ thanh toán cho các cửa hàng mới
        const settlementsToCreate = newStores.map(store => ({
            store_id: store.id,
            period,
            total_revenue: 0,
            total_commission: 0,
            total_refund: 0,
            net_payout: 0,
            status: 'pending'
        }));

        const createdSettlements = await Settlement.bulkCreate(settlementsToCreate);

        // Gửi email thông báo cho các cửa hàng
        for (const store of newStores) {
            await sendMail({
                to: store.email,
                subject: `Thông báo kỳ thanh toán ${period}`,
                html: `
                    <h2>Thông báo kỳ thanh toán mới</h2>
                    <p>Cửa hàng: <strong>${store.name}</strong></p>
                    <p>Kỳ thanh toán: <strong>${period}</strong></p>
                    <p>Trạng thái: <strong>pending</strong></p>
                    <p>Vui lòng đăng nhập vào hệ thống để biết thêm chi tiết.</p>
                `
            });
        }

        return res.status(201).json({
            code: 0,
            message: `Tạo kỳ thanh toán cho ${createdSettlements.length} cửa hàng thành công`,
            data: {
                created_count: createdSettlements.length,
                total_stores: stores.length,
                existing_settlements: existingSettlements.length,
                period
            }
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};
