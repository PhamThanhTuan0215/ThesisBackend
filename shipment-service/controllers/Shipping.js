const { Op } = require('sequelize');
const Shipment = require('../database/models/Shipment');
const Joi = require('joi');
const { SHIPPING_STATUS, CHECKPOINT_STATUS, CHECKPOINT_TO_SHIPPING_STATUS } = require('../enums/status');

// Schema validate tạo vận đơn
const createOrderSchema = Joi.object({
    order_id: Joi.number().required(),
    shipping_provider_id: Joi.number().required(),
    shipping_address_from_id: Joi.number().required(),
    shipping_address_to_id: Joi.number().required(),
});

// Schema validate checkpoint
const scanSchema = Joi.object({
    location: Joi.string().required(),
    status: Joi.string().valid(...Object.values(CHECKPOINT_STATUS)).required(),
});

// Hàm tự động sinh note dựa vào status và location
function formatNote(status, location) {
    switch (status) {
        case CHECKPOINT_STATUS.PICKUP_SUCCESS:
            return `Đơn hàng đã được lấy tại ${location}`;
        case CHECKPOINT_STATUS.PICKUP_FAILED:
            return `Lấy hàng thất bại tại ${location}`;
        case CHECKPOINT_STATUS.ARRIVAL_WAREHOUSE:
            return `Đơn hàng đang ở kho ${location}`;
        case CHECKPOINT_STATUS.DEPARTURE_WAREHOUSE:
            return `Đơn hàng đã rời kho ${location}`;
        case CHECKPOINT_STATUS.IN_TRANSIT:
            return `Đơn hàng đang di chuyển qua ${location}`;
        case CHECKPOINT_STATUS.OUT_FOR_DELIVERY:
            return `Đơn hàng đang giao cho khách tại ${location}`;
        case CHECKPOINT_STATUS.DELIVERED_SUCCESS:
            return `Đơn hàng đã giao thành công tại ${location}`;
        case CHECKPOINT_STATUS.DELIVERED_FAILED:
            return `Giao hàng thất bại tại ${location}`;
        case CHECKPOINT_STATUS.RETURN_TO_SENDER:
            return `Đơn hàng đang hoàn trả về ${location}`;
        default:
            return `Cập nhật trạng thái tại ${location}`;
    }
}

// Hàm sinh tracking_number tự động
function generateTrackingNumber() {
    const now = new Date();
    const pad = (n, l = 2) => n.toString().padStart(l, '0');
    const yyyy = now.getFullYear();
    const MM = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const rand = Math.floor(1000 + Math.random() * 9000); // 4 số random
    return `SH${yyyy}${MM}${dd}${HH}${mm}${ss}${rand}`;
}

// Tạo vận đơn mới
module.exports.createShippingOrder = async (req, res) => {
    const { error } = createOrderSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: 1, success: false, message: error.details[0].message });
    }
    try {
        const tracking_number = generateTrackingNumber();
        const shipment = await Shipment.create({
            ...req.body,
            tracking_number,
            current_status: SHIPPING_STATUS.WAITING_FOR_PICKUP,
            progress: [],
        });
        res.status(201).json({ code: 0, success: true, data: shipment });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Danh sách vận đơn (lọc theo status, tracking_number)
module.exports.getShippingOrders = async (req, res) => {
    try {
        const where = {};
        if (req.query.current_status) where.current_status = req.query.current_status;
        if (req.query.tracking_number) where.tracking_number = req.query.tracking_number;
        const shipments = await Shipment.findAll({ where });
        res.json({ code: 0, success: true, data: shipments });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Lấy chi tiết vận đơn
module.exports.getShippingOrderById = async (req, res) => {
    try {
        const shipment = await Shipment.findByPk(req.params.id);
        if (!shipment) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping order not found' });
        }
        res.json({ code: 0, success: true, data: shipment });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Quét mã (thêm checkpoint)
module.exports.scanCheckpoint = async (req, res) => {
    const { error } = scanSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: 1, success: false, message: error.details[0].message });
    }
    try {
        const shipment = await Shipment.findByPk(req.params.id);
        if (!shipment) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping order not found' });
        }
        // Tự động sinh note
        const note = formatNote(req.body.status, req.body.location);
        // Thêm checkpoint vào progress
        const checkpoint = {
            location: req.body.location,
            status: req.body.status,
            note,
            timestamp: new Date(),
        };
        const progress = Array.isArray(shipment.progress) ? shipment.progress : [];
        progress.push(checkpoint);
        // Map checkpoint status sang shipping status nếu có quy tắc
        let newStatus = shipment.current_status;
        if (CHECKPOINT_TO_SHIPPING_STATUS[req.body.status]) {
            newStatus = CHECKPOINT_TO_SHIPPING_STATUS[req.body.status];
        }
        await shipment.update({ progress, current_status: newStatus });
        res.json({ code: 0, success: true, data: shipment });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Lấy progress (timeline quét mã)
module.exports.getProgress = async (req, res) => {
    try {
        const shipment = await Shipment.findByPk(req.params.id);
        if (!shipment) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping order not found' });
        }
        res.json({ code: 0, success: true, data: shipment.progress });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Cập nhật trạng thái tổng thủ công
module.exports.updateStatus = async (req, res) => {
    const schema = Joi.object({ current_status: Joi.string().valid(...Object.values(SHIPPING_STATUS)).required() });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: 1, success: false, message: error.details[0].message });
    }
    try {
        const shipment = await Shipment.findByPk(req.params.id);
        if (!shipment) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping order not found' });
        }
        await shipment.update({ current_status: req.body.current_status });
        res.json({ code: 0, success: true, data: shipment });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
}; 