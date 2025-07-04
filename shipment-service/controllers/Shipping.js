const { Op } = require('sequelize');
const Shipment = require('../database/models/Shipment');
const Joi = require('joi');
const { SHIPPING_STATUS, CHECKPOINT_STATUS, CHECKPOINT_TO_SHIPPING_STATUS } = require('../enums/status');
const ShippingAddress = require('../database/models/ShippingAddress');
const orderServiceAxios = require('../services/orderService');

// Schema validate tạo vận đơn
const createOrderSchema = Joi.object({
    order_id: Joi.number().required(),
    user_id: Joi.number().required(),
    seller_id: Joi.number().required(),
    returned_order_id: Joi.number().optional()
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
        const shipping_address_to = await ShippingAddress.findOne({ where: { user_id: req.body.user_id } });
        const shipment = await Shipment.create({
            ...req.body,
            shipping_provider_id: 1,
            shipping_address_from_id: req.body.seller_id,
            shipping_address_to_id: shipping_address_to.id,
            tracking_number,
            current_status: SHIPPING_STATUS.WAITING_FOR_PICKUP,
            progress: [],
        });

        axiosNotificationService.post('/notifications', {
            target_type: 'shipper',
            title: 'Có đơn vận chuyển mới được tạo',
            body: `Có đơn vận chuyển mới được tạo, vui lòng đi lấy hàng.`
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

        // gọi api order-service để lấy thêm payment_method và payment_status
        const order_ids = shipments.map(shipment => shipment.order_id);

        const response = await orderServiceAxios.post(`/orders/ids`, { ids: order_ids });
        const orders = response.data.data;
        const orderMap = new Map(orders.map(order => [order.id, order]));

        // Convert Sequelize instances to plain objects and add payment info
        const formattedShipments = shipments.map(shipment => {
            // Convert to plain object
            const plainShipment = shipment.get({ plain: true });
            const order = orderMap.get(shipment.order_id);

            if (order) {
                plainShipment.payment_method = order.payment_method;
                plainShipment.payment_status = order.payment_status;
                plainShipment.final_total = order.final_total;
            }

            return plainShipment;
        });

        res.json({ code: 0, success: true, data: formattedShipments });
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

// Lấy chi tiết vận đơn theo order_id
module.exports.getShippingOrderByOrderId = async (req, res) => {
    try {
        const shipment = await Shipment.findOne({ where: { order_id: req.params.id } });
        res.json({ code: 0, success: true, data: shipment });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Lấy chi tiết vận đơn theo returned_order_id
module.exports.getShippingOrderByReturnedOrderId = async (req, res) => {
    try {
        const shipment = await Shipment.findOne({ where: { returned_order_id: req.params.id } });
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

        const progress = Array.isArray(shipment.progress) ? [...shipment.progress] : [];
        progress.push(checkpoint);

        // Map checkpoint status sang shipping status nếu có quy tắc
        let newStatus = shipment.current_status;
        if (CHECKPOINT_TO_SHIPPING_STATUS[req.body.status]) {
            newStatus = CHECKPOINT_TO_SHIPPING_STATUS[req.body.status];
        }

        // QUAN TRỌNG: Phải mark field progress đã thay đổi
        shipment.progress = progress;
        shipment.current_status = newStatus;
        shipment.changed('progress', true);

        await shipment.save();

        // --- CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG BÊN ORDER SERVICE ---
        // Mapping shipping status -> order status
        let mappedOrderStatus = null;
        switch (newStatus) {
            case SHIPPING_STATUS.PICKED_UP:
                mappedOrderStatus = 'ready_to_ship'; break;
            case SHIPPING_STATUS.IN_TRANSIT:
            case SHIPPING_STATUS.OUT_FOR_DELIVERY:
                mappedOrderStatus = 'shipping'; break;
            case SHIPPING_STATUS.DELIVERED:
                mappedOrderStatus = 'delivered'; break;
            case SHIPPING_STATUS.RETURNED:
            case SHIPPING_STATUS.CANCELLED:
            case SHIPPING_STATUS.LOST:
            case SHIPPING_STATUS.DAMAGED:
                mappedOrderStatus = 'cancelled'; break;
            case SHIPPING_STATUS.DELIVERY_FAILED:
                mappedOrderStatus = 'confirmed'; break;
            default:
                mappedOrderStatus = null;
        }

        // --- CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG HOÀN TRẢ BÊN ORDER SERVICE ---
        // Mapping shipping status -> returned order status
        let mappedReturnedOrderStatus = null;
        switch (newStatus) {
            case SHIPPING_STATUS.PICKED_UP:
                mappedReturnedOrderStatus = 'ready_to_ship'; break;
            case SHIPPING_STATUS.IN_TRANSIT:
            case SHIPPING_STATUS.OUT_FOR_DELIVERY:
            case SHIPPING_STATUS.RETURNING:
                mappedReturnedOrderStatus = 'shipping'; break;
            case SHIPPING_STATUS.DELIVERED:
            case SHIPPING_STATUS.RETURNED:
                mappedReturnedOrderStatus = 'returned'; break;
            case SHIPPING_STATUS.CANCELLED:
            case SHIPPING_STATUS.LOST:
            case SHIPPING_STATUS.DAMAGED:
            case SHIPPING_STATUS.DELIVERY_FAILED:
                mappedReturnedOrderStatus = 'failed'; break;
            default:
                mappedReturnedOrderStatus = null;
        }

        // Chỉ gọi nếu shipment có order_id và mappedOrderStatus hợp lệ (không phải đơn hàng hoàn trả)
        if (shipment.order_id && mappedOrderStatus && shipment.returned_order_id === null) {
            try {
                await orderServiceAxios.put(`/orders/${shipment.order_id}`, { order_status: mappedOrderStatus });
            } catch (err) {
                // log lỗi nhưng không làm fail response
                console.error('Failed to update order status:', err.message);
            }
        }
        // Chỉ gọi nếu shipment có returned_order_id và mappedReturnedOrderStatus hợp lệ (đơn hàng hoàn trả)
        else if (shipment.returned_order_id && mappedReturnedOrderStatus) {
            try {
                await orderServiceAxios.put(`/order-returns/returned-order/${shipment.returned_order_id}`, { order_status: mappedReturnedOrderStatus });
            } catch (err) {
                // log lỗi nhưng không làm fail response
                console.error('Failed to update returned order status:', err.message);
            }
        }
        // --- END cập nhật trạng thái order ---

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