const Order = require('../database/models/Order');
const OrderItem = require('../database/models/OrderItem');
const { Op } = require('sequelize');
const sequelize = require('../database/sequelize');

const axiosProductService = require('../services/productService')
const axiosCustomerService = require('../services/customerService')

module.exports.getOrder = async (req, res) => {
    try {
        const { startDate, endDate, order_status } = req.query;

        const conditions = {};

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

        if (selectedStartDate && selectedEndDate) {
            conditions.createdAt = {
                [Op.gte]: selectedStartDate,
                [Op.lte]: selectedEndDate
            };
        }

        if (order_status && order_status !== '') {
            conditions.order_status = order_status;
        }

        const orders = await Order.findAll({
            where: conditions,
            order: [
                // Đưa order_status = 'cancelled' xuống cuối cùng
                [sequelize.literal(`CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END`), 'ASC'],
                
                // sắp xếp theo ngày tạo đơn hàng
                ['createdAt', 'DESC']
            ]
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách đơn hàng thành công', data: orders });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách đơn hàng thất bại', error: error.message });
    }
}

module.exports.createOrder = async (req, res) => {
    try {
        const { user_id, payment_method, payment_status, stores } = req.body;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!payment_method || payment_method === '') errors.push('payment_method cần cung cấp');
        if (!payment_status || payment_status === '') errors.push('payment_status cần cung cấp');
        if (!stores || !Array.isArray(stores)) errors.push('stores cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        };

        // kiểm tra tồn kho (gọi api của product service)
        const products = [];
        for (const store of stores) {
            for (const product of store.products) {
                products.push({
                    id: product.product_id,
                    name: product.product_name,
                    quantity: product.quantity
                });
            }
        }

        const response = await axiosProductService.post('/products/check-stock', {
            products: products
        });

        if (response.data.code !== 0) {
            return res.status(400).json({ code: 1, message: response.data.message || 'Sản phẩm không đủ hàng' });
        }

        // tạo các đơn hàng cùng chi tiết đơn hàng theo từng cửa hàng, tạo đồng thời
        const orderPromises = stores.map(async (store) => {
            
            const total = (store.original_items_total + store.original_shipping_fee) - (store.discount_amount_items + store.discount_amount_shipping + store.discount_amount_items_platform_allocated + store.discount_amount_shipping_platform_allocated);

            // Tạo đơn hàng cho mỗi cửa hàng
            const order = await Order.create({
                user_id,
                seller_id: store.seller_id,
                total_quantity: store.total_quantity,
                original_items_total: store.original_items_total,
                original_shipping_fee: store.original_shipping_fee,
                discount_amount_items: store.discount_amount_items,
                discount_amount_shipping: store.discount_amount_shipping,
                discount_amount_items_platform_allocated: store.discount_amount_items_platform_allocated,
                discount_amount_shipping_platform_allocated: store.discount_amount_shipping_platform_allocated,
                final_total: total,
                payment_method,
                payment_status
            });

            // Tạo chi tiết đơn hàng
            const orderItems = store.products.map(product => ({
                order_id: order.id,
                product_id: product.product_id,
                product_name: product.product_name,
                product_price: product.price,
                product_quantity: product.quantity,
                product_url_image: product.product_url_image
            }));

            await OrderItem.bulkCreate(orderItems);

            // tạo dữ liệu về các sản phẩm đã mua và cập nhật kho hàng (gọi api của product service)
            axiosProductService.post('/purchased-products/add', {
                user_id,
                order_id: order.id,
                seller_id: store.seller_id,
                list_product: orderItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.product_quantity,
                    total_price: item.product_price * item.product_quantity
                }))
            });

            // xóa các sản phẩm đã mua khỏi giỏ hàng (gọi api của customer service)
            axiosCustomerService.post('/carts/remove', {
                user_id,
                product_ids: orderItems.map(item => item.product_id)
            });

            return order;
        });

        // Đợi tất cả đơn hàng và chi tiết đơn hàng được tạo
        const orders = await Promise.all(orderPromises);

        return res.status(201).json({ code: 0, message: 'Tạo đơn hàng thành công', data: orders });

    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Tạo đơn hàng thất bại', error: error.message });
    }
}

module.exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status, order_status } = req.body;

        const errors = [];

        if (!id || id <= 0) errors.push('id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ code: 1, message: 'Đơn hàng không tồn tại' });
        }
        
        if(order.is_completed) {
            return res.status(400).json({ code: 1, message: 'Đơn hàng đã hoàn tất, không thể cập nhật' });
        }

        if(order_status && order_status !== '') {
            order.order_status = order_status;
        }

        if(payment_status && payment_status !== '') {
            order.payment_status = payment_status;
        }

        await order.save();

        if(order.is_completed) {
            // cập nhật dữ liệu về các sản phẩm đã mua (gọi api của product service)
            axiosProductService.put('/purchased-products/update-status', {
                order_id: order.id,
                status: 'completed'
            });
        }

        return res.status(200).json({ code: 0, message: 'Cập nhật đơn hàng thành công', data: order });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Cập nhật đơn hàng thất bại', error: error.message });
    }
}

module.exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const errors = [];

        if (!id || id <= 0) errors.push('id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ code: 1, message: 'Đơn hàng không tồn tại' });
        }

        if(order.is_completed) {
            return res.status(400).json({ code: 1, message: 'Đơn hàng đã hoàn tất, không thể hủy' });
        }

        if (order.payment_status !== 'pending') {
            return res.status(400).json({ code: 1, message: 'Đơn hàng đã được thanh toán, không thể hủy' });
        }

        if (order.order_status !== 'pending') {
            return res.status(400).json({ code: 1, message: 'Đơn hàng đang được xử lý, không thể hủy' });
        }

        order.order_status = 'cancelled';
        await order.save();

        // xóa dữ liệu về các sản phẩm đã mua (gọi api của product service)
        axiosProductService.delete(`/purchased-products/cancel/${order.id}`);

        return res.status(200).json({ code: 0, message: 'Hủy đơn hàng thành công', data: order });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Hủy đơn hàng thất bại', error: error.message });
    }
}

module.exports.getOrderByUserId = async (req, res) => {
    try {
        const { user_id } = req.query;
        const { startDate, endDate, order_status } = req.query;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const conditions = {
            user_id
        };

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

        if (selectedStartDate && selectedEndDate) {
            conditions.createdAt = {
                [Op.gte]: selectedStartDate,
                [Op.lte]: selectedEndDate
            };
        }

        if (order_status && order_status !== '') {
            conditions.order_status = order_status;
        }

        const orders = await Order.findAll({
            where: conditions,
            order: [
                // Đưa order_status = 'cancelled' xuống cuối cùng
                [sequelize.literal(`CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END`), 'ASC'],
                
                // sắp xếp theo ngày tạo đơn hàng
                ['createdAt', 'DESC']
            ]
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách đơn hàng theo id người dùng thành công', data: orders });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy đơn hàng theo id người dùng thất bại', error: error.message });
    }
}

module.exports.getOrderBySellerId = async (req, res) => {
    try {
        const { seller_id } = req.params;
        const { startDate, endDate, order_status } = req.query;

        const errors = [];

        if (!seller_id || seller_id <= 0) errors.push('seller_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const conditions = {
            seller_id
        };

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

        if (selectedStartDate && selectedEndDate) {
            conditions.createdAt = {
                [Op.gte]: selectedStartDate,
                [Op.lte]: selectedEndDate
            };
        }

        if (order_status && order_status !== '') {
            conditions.order_status = order_status;
        }

        const orders = await Order.findAll({
            where: conditions,
            order: [
                // Đưa order_status = 'cancelled' xuống cuối cùng
                [sequelize.literal(`CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END`), 'ASC'],
                
                // sắp xếp theo ngày tạo đơn hàng
                ['createdAt', 'DESC']
            ]
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách đơn hàng theo id người bán thành công', data: orders });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy đơn hàng theo id người bán thất bại', error: error.message });
    }
}

module.exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({ code: 1, message: 'Đơn hàng không tồn tại' });
        }

        return res.status(200).json({ code: 0, message: 'Lấy đơn hàng theo id thành công', data: order });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy đơn hàng theo id thất bại', error: error.message });
    }
}

module.exports.getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const orderItems = await OrderItem.findAll({
            where: {
                order_id: id
            }
        });

        if (!orderItems || orderItems.length === 0) {
            return res.status(404).json({ code: 1, message: 'Chi tiết đơn hàng không tồn tại' });
        }

        return res.status(200).json({ code: 0, message: 'Lấy chi tiết đơn hàng thành công', data: orderItems });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy chi tiết đơn hàng thất bại', error: error.message });
    }
}
