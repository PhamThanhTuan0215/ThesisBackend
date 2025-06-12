const Order = require('../database/models/Order');
const OrderItem = require('../database/models/OrderItem');
const OrderReturnRequest = require('../database/models/OrderReturnRequest');
const ReturnedOrder = require('../database/models/ReturnedOrder');
const ReturnedOrderItem = require('../database/models/ReturnedOrderItem');
const sequelize = require('../database/sequelize');

const axiosShipmentService = require('../services/shipmentService')
const axiosProductService = require('../services/productService')

// Tạo yêu cầu hoàn trả
exports.createReturnRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { order_id } = req.params;
        const { reason, customer_message, customer_shipping_address_id, items } = req.body;

        // Kiểm tra đơn hàng có tồn tại và đã hoàn thành
        const order = await Order.findOne({
            where: {
                id: order_id,
                is_completed: true
            }
        });

        if (!order) {
            return res.status(404).json({
                code: 1,
                message: 'Đơn hàng không tồn tại hoặc chưa hoàn thành'
            });
        }

        // Kiểm tra yêu cầu hoàn trả đã tồn tại
        const existingRequest = await OrderReturnRequest.findOne({
            where: {
                order_id,
                status: 'requested'
            }
        });

        if (existingRequest) {
            return res.status(400).json({
                code: 1,
                message: 'Yêu cầu hoàn trả đã tồn tại'
            });
        }

        const orderItems = await OrderItem.findAll({
            where: {
                order_id
            }
        });

        // Tạo yêu cầu hoàn trả
        const returnRequest = await OrderReturnRequest.create({
            order_id,
            seller_id: order.seller_id,
            user_id: order.user_id,
            reason,
            customer_message,
            status: 'requested',
            request_at: new Date(),
            customer_shipping_address_id,
        }, { transaction });

        // Tạo các sản phẩm trong yêu cầu hoàn trả
        const promises = items.map(async (item) => {
            const orderItem = orderItems.find(oi => oi.id == item.id);
            if (!orderItem) {
                throw new Error(`Sản phẩm có id là ${item.product_id} không tồn tại trong đơn hàng`);
            }
            if (item.product_quantity > orderItem.product_quantity) {
                throw new Error(`Số lượng hoàn trả không được vượt quá số lượng sản phẩm trong đơn hàng`);
            }
            return ReturnedOrderItem.create({
                order_return_request_id: returnRequest.id,
                product_id: orderItem.product_id,
                product_name: orderItem.product_name,
                product_price: orderItem.product_price,
                product_quantity: item.product_quantity,
                product_url_image: orderItem.product_url_image
            }, { transaction });
        });
        await Promise.all(promises);

        await transaction.commit();

        return res.status(201).json({
            code: 0,
            message: 'Yêu cầu hoàn trả đã được gửi thành công',
            data: returnRequest
        });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
            code: 2,
            message: error.message
        });
    }
};

// Xóa yêu cầu hoàn trả
exports.deleteReturnRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const returnRequest = await OrderReturnRequest.findOne({
            where: { id }
        });

        if (!returnRequest) {
            return res.status(404).json({
                code: 1,
                message: 'Yêu cầu hoàn trả không tồn tại'
            });
        }

        await returnRequest.destroy();

        return res.status(200).json({
            code: 0,
            message: 'Yêu cầu hoàn trả đã được hủy thành công'
        });
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: error.message
        });
    }
};

// Lấy danh sách yêu cầu hoàn trả
exports.getReturnRequests = async (req, res) => {
    try {
        const { status, seller_id, user_id } = req.query;
        const where = {};

        if (seller_id) {
            where.seller_id = seller_id;
        }

        if (user_id) {
            where.user_id = user_id;
        }

        if (status) {
            if (!['requested', 'accepted', 'rejected'].includes(status)) {
                return res.status(400).json({
                    code: 1,
                    message: 'Trạng thái không hợp lệ'
                });
            }
            where.status = status;
        }

        const requests = await OrderReturnRequest.findAll({
            where,
            include: [
                {
                    model: Order,
                    attributes: ['id', 'total_quantity', 'final_total', 'createdAt', 'updatedAt']
                }
            ],
            order: [['request_at', 'DESC']]
        });

        return res.json({
            code: 0,
            message: 'Lấy danh sách yêu cầu hoàn trả thành công',
            data: requests
        });
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: error.message
        });
    }
};

// Lấy yêu cầu hoàn trả bằng id
exports.getReturnRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const returnRequest = await OrderReturnRequest.findByPk(id);

        if (!returnRequest) {
            return res.status(404).json({ code: 1, message: 'Yêu cầu hoàn trả không tồn tại' });
        }

        return res.json({ code: 0, message: 'Lấy yêu cầu hoàn trả thành công', data: returnRequest });
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: error.message
        });
    }
}

// Lấy chi tiết các sản phẩm trong yêu cầu hoàn trả hoặc đơn hoàn trả (dùng chung 1 hàm)
exports.getReturnedOrderDetail = async (req, res) => {
    try {
        // order_return_request_id và returned_order_id chỉ cung cấp 1 trong 2
        const { order_return_request_id, returned_order_id } = req.query;

        const where = {};

        if (order_return_request_id) {
            where.order_return_request_id = order_return_request_id;
        }

        if (returned_order_id) {
            where.returned_order_id = returned_order_id;
        }

        const returnedOrderItems = await ReturnedOrderItem.findAll({
            where
        });

        if (!returnedOrderItems || returnedOrderItems.length === 0) {
            return res.status(404).json({ code: 1, message: 'Chi tiết đơn hàng hoàn trả không tồn tại' });
        }

        return res.json({
            code: 0,
            message: 'Lấy chi tiết đơn hàng hoàn trả thành công',
            data: returnedOrderItems
        });
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: error.message
        });
    }
};

// Phản hồi yêu cầu hoàn trả (chấp nhận/từ chối)
exports.responseReturnRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { request_id } = req.params;
        const { status, response_message } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                code: 1,
                message: 'Trạng thái không hợp lệ'
            });
        }

        const request = await OrderReturnRequest.findOne({
            where: {
                id: request_id,
                status: 'requested'
            }
        });

        if (!request) {
            return res.status(404).json({
                code: 1,
                message: 'Yêu cầu hoàn trả không tồn tại hoặc không ở trạng thái chờ phản hồi'
            });
        }

        // Update request status
        request.status = status;
        request.response_message = response_message;
        request.response_at = new Date();
        await request.save({ transaction });

        if (status === 'accepted') {
            // lấy dánh sách returned_order_item
            const returnedOrderItems = await ReturnedOrderItem.findAll({
                where: {
                    order_return_request_id: request.id
                }
            });

            // lấy đơn hàng gốc
            const order = await Order.findOne({
                where: {
                    id: request.order_id
                }
            });

            const order_original_items_total = order.original_items_total;
            const order_discount_amount_items = order.discount_amount_items;
            const order_discount_amount_items_platform_allocated = order.discount_amount_items_platform_allocated;

            const total_items_price = Number(order_original_items_total); // tổng tiền các sản phẩm trong đơn hàng gốc
            const total_discount_amount_items = Number(order_discount_amount_items) + Number(order_discount_amount_items_platform_allocated); // tổng tiền đã được giảm giá các sản phẩm trong đơn hàng gốc

            const total_quantity = returnedOrderItems.reduce((acc, item) => acc + item.product_quantity, 0);

            // tính toán tổng số tiền cần hoàn trả cho đơn hàng hoàn trả
            const refund_amount = calculateReturnAmountOrder(total_items_price, total_discount_amount_items, returnedOrderItems);

            // tính toán tiền vận chuyển cần hoàn trả (gọi api shipment service)
            const response = await axiosShipmentService.post('/shipments/return-shipping-fee', {
                customer_shipping_address_id: request.customer_shipping_address_id,
                seller_id: order.seller_id
            });

            if (response.data.code !== 0) {
                return res.status(400).json({ code: 1, message: response.data.message || 'Có lỗi khi tính toán tiền vận chuyển cần hoàn trả' });
            }

            const return_shipping_fee = response.data.data; // tiền vận chuyển cần hoàn trả

            // tạo returned_order
            const returnedOrder = await ReturnedOrder.create({
                order_return_request_id: request.id,
                order_id: order.id,
                seller_id: order.seller_id,
                seller_name: order.seller_name,
                user_id: request.user_id,
                total_quantity: total_quantity,
                return_shipping_fee: return_shipping_fee,
                return_shipping_fee_paid_by: request.return_shipping_fee_paid_by,
                refund_amount: refund_amount,
                order_status: 'processing',
                payment_refund_status: 'pending'
            }, { transaction });

            // cập nhật returned_order_id vào các returned_order_item
            const promises = returnedOrderItems.map(async (item) => {
                item.returned_order_id = returnedOrder.id;
                await item.save({ transaction });
            });
            await Promise.all(promises);
        }

        await transaction.commit();
        return res.json({
            code: 0,
            message: 'Phản hồi yêu cầu hoàn trả thành công',
            data: request
        });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
            code: 2,
            message: error.message
        });
    }
};

// Lấy danh sách đơn hàng hoàn trả
exports.getReturnedOrders = async (req, res) => {
    try {
        const { seller_id, user_id } = req.query;
        const where = {};

        if (seller_id) {
            where.seller_id = seller_id;
        }

        if (user_id) {
            where.user_id = user_id;
        }

        const returnedOrders = await ReturnedOrder.findAll({
            where,
            order: [['returned_at', 'DESC']]
        });

        return res.json({
            code: 0,
            message: 'Lấy danh sách đơn hàng hoàn trả thành công',
            data: returnedOrders
        });
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: error.message
        });
    }
};

// Lấy đơn hàng hoàn trả bằng id
exports.getReturnedOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const returnedOrder = await ReturnedOrder.findByPk(id);

        if (!returnedOrder) {
            return res.status(404).json({ code: 1, message: 'Đơn hàng hoàn trả không tồn tại' });
        }

        return res.json({ code: 0, message: 'Lấy đơn hàng hoàn trả thành công', data: returnedOrder });
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: error.message
        });
    }
}

// Cập nhật đơn hàng hoàn trả
exports.updateReturnedOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status, payment_refund_status } = req.body;

        const returnedOrder = await ReturnedOrder.findByPk(id);

        if (!returnedOrder) {
            return res.status(404).json({ code: 1, message: 'Đơn hàng hoàn trả không tồn tại' });
        }

        if (returnedOrder.is_completed) {
            return res.status(400).json({ code: 1, message: 'Đơn hàng hoàn trả đã hoàn tất, không thể cập nhật' });
        }

        if (order_status && order_status !== '') {
            returnedOrder.order_status = order_status;
        }

        if (payment_refund_status && payment_refund_status !== '') {
            returnedOrder.payment_refund_status = payment_refund_status;
        }

        await returnedOrder.save();

        if (returnedOrder.is_completed) {

            const returnedOrderItems = await ReturnedOrderItem.findAll({
                where: {
                    returned_order_id: returnedOrder.id
                }
            });

            const list_product = returnedOrderItems.map(item => ({
                product_id: item.product_id,
                quantity: item.product_quantity,
                total_price: item.product_price * item.product_quantity
            }));

            // cập nhật dữ liệu về các sản phẩm đã mua (gọi api của product service)
            axiosProductService.put(`/purchased-products/returned/${returnedOrder.order_id}`, {
                list_product
            });

            // cập nhật trạng thái đơn hàng gốc
            Order.update({
                order_status: 'refunded',
                payment_status: 'refunded'
            }, {
                where: {
                    id: returnedOrder.order_id
                }
            });
        }

        return res.json({ code: 0, message: 'Cập nhật đơn hàng hoàn trả thành công', data: returnedOrder });
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: error.message
        });
    }
}

// hàm tính tiền hoàn trả cho mỗi sản phẩm (tính luôn số lượng)
const calculateReturnAmountItem = (total_items_price, total_discount_amount_items, item) => {
    const discount = (item.product_price / total_items_price) * total_discount_amount_items; // phân bổ tiền đã giảm giá cho sản phẩm
    return (item.product_price - discount) * item.product_quantity; // tiền hoàn trả cho sản phẩm
}

// hàm tính tiền hoàn trả cho đơn hàng hoàn trả
const calculateReturnAmountOrder = (total_items_price, total_discount_amount_items, returnedOrderItems) => {
    const total_return_amount = returnedOrderItems.reduce((acc, item) => acc + calculateReturnAmountItem(total_items_price, total_discount_amount_items, item), 0);
    return total_return_amount;
}