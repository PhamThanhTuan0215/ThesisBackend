const CartItem = require('../database/models/CartItem')
const axiosProductService = require('../services/productService')

const { formatItem } = require('../utils/formatItem')

module.exports.getCart = async (req, res) => {
    try {

        const { user_id } = req.query

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const rawCartItems = await CartItem.findAll({
            where: { user_id },
            order: [['updatedAt', 'DESC']]
        });

        const product_ids = rawCartItems.map(item => item.product_id);

        // gọi api tới product-service để lấy danh sách sản phẩm
        const response = await axiosProductService.post('/products/get-products-by-ids', {
            product_ids
        });

        if (response.data.code !== 0) {
            return res.status(400).json({ code: 1, message: response.data.message || 'Lấy danh sách sản phẩm trong giỏ hàng thất bại' });
        }

        const products = response.data.data;

        const cartItemsWithProducts = rawCartItems.map(item => {
            const product = products.find(product => product.id === item.product_id);
            return formatItem(item, product);
        });

        // lọc ra các sản phẩm đang được phép bán
        const cartItems = cartItemsWithProducts.filter(product => 
            product.approval_status === 'approved' && 
            product.active_status === 'active' && 
            product.platform_active_status === 'active'
        );

        // Gom nhóm theo nhà bán dựa vào seller_id
        const grouped = {};
        for (const item of cartItems) {
            const sellerId = item.seller_id;
            if (!grouped[sellerId]) {
                grouped[sellerId] = {
                    seller_id: item.seller_id,
                    seller_name: item.seller_name,
                    total_quantity: 0,
                    total_price: 0,
                    products: [],
                };
            }
            grouped[sellerId].total_quantity += item.quantity;
            grouped[sellerId].total_price += item.quantity * item.price;
            grouped[sellerId].products.push(item);
        }

        const stores = Object.values(grouped);

        return res.status(200).json({ code: 0, message: 'Lấy danh sách sản phẩm trong giỏ hàng thành công', data: stores });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách sản phẩm trong giỏ hàng thất bại', error: error.message });
    }
}

module.exports.getCartToCheckout = async (req, res) => {
    try {

        const { user_id } = req.query

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const rawCartItems = await CartItem.findAll({
            where: { user_id },
            order: [['updatedAt', 'DESC']]
        });

        const product_ids = rawCartItems.map(item => item.product_id);

        // gọi api tới product-service để lấy danh sách sản phẩm
        const response = await axiosProductService.post('/products/get-products-by-ids', {
            product_ids
        });

        if (response.data.code !== 0) {
            return res.status(400).json({ code: 1, message: response.data.message || 'Lấy danh sách sản phẩm trong giỏ hàng thất bại' });
        }

        const products = response.data.data;

        const cartItemsWithProducts = rawCartItems.map(item => {
            const product = products.find(product => product.id === item.product_id);
            return formatItem(item, product);
        });

        // lọc ra các sản phẩm đang được phép bán
        const cartItems = cartItemsWithProducts.filter(product => 
            product.approval_status === 'approved' && 
            product.active_status === 'active' && 
            product.platform_active_status === 'active'
        );

        // Gom nhóm theo nhà bán dựa vào seller_id
        const grouped = {};
        for (const item of cartItems) {
            const sellerId = item.seller_id;
            if (!grouped[sellerId]) {
                grouped[sellerId] = {
                    seller_id: item.seller_id,
                    seller_name: item.seller_name,
                    total_quantity: 0,
                    original_items_total: 0,
                    original_shipping_fee: 0,
                    discount_amount_items: 0,
                    discount_amount_shipping: 0,
                    items_total_after_discount: 0,
                    shipping_fee_after_discount: 0,
                    discount_amount_items_platform_allocated: 0,
                    discount_amount_shipping_platform_allocated: 0,
                    final_total: 0,
                    order_voucher: {
                        is_applied: false,
                        code: '',
                        voucher_id: null,
                        discount_amount: 0,
                    },
                    freeship_voucher: {
                        is_applied: false,
                        code: '',
                        voucher_id: null,
                        discount_amount: 0,
                    },
                    platform_order_voucher: {
                        is_applied: false,
                        code: '',
                        voucher_id: null,
                        discount_amount: 0,
                    },
                    platform_freeship_voucher: {
                        is_applied: false,
                        code: '',
                        voucher_id: null,
                        discount_amount: 0,
                    },
                    products: [],
                };
            }
            grouped[sellerId].total_quantity += item.quantity;
            grouped[sellerId].original_items_total += item.quantity * item.price;
            grouped[sellerId].items_total_after_discount += item.quantity * item.price;
            grouped[sellerId].final_total += item.quantity * item.price;
            grouped[sellerId].products.push(item);
        }

        const stores = Object.values(grouped);

        return res.status(200).json({ code: 0, message: 'Lấy thông tin thanh toán giỏ hàng thành công', data: stores });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy thông tin thanh toán giỏ hàng thất bại', error: error.message });
    }
}

module.exports.addProductToCart = async (req, res) => {
    try {

        const {
            user_id,
            product_id,
            quantity
        } = req.body;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!product_id || product_id <= 0) errors.push('product_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        let quantity_to_add = 1;
        if(quantity && quantity > 1) {
            quantity_to_add = quantity;
        }

        let existingItem = await CartItem.findOne({ where: { user_id, product_id } });

        if (existingItem) {

            existingItem.quantity += quantity_to_add;

            const response = await axiosProductService.post('/products/check-stock', {
                products: [
                    {
                        id: product_id,
                        quantity: existingItem.quantity
                    }
                ]
            });

            if (response.data.code !== 0) {
                return res.status(400).json({ code: 1, message: response.data.message || 'Sản phẩm không đủ hàng' });
            }

            await existingItem.save();
        }
        else {

            const response = await axiosProductService.post('/products/check-stock', {
                products: [
                    {
                        id: product_id,
                        quantity: quantity_to_add
                    }
                ]
            });

            if (response.data.code !== 0) {
                return res.status(400).json({ code: 1, message: response.data.message || 'Sản phẩm không đủ hàng' });
            }

            existingItem = await CartItem.create({
                user_id,
                product_id,
                quantity: quantity_to_add
            });
        }

        return res.status(200).json({ code: 0, message: 'Thêm sản phẩm vào giỏ hàng thành công', data: existingItem });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Thêm sản phẩm vào giỏ hàng thất bại', error: error.message });
    }
}

module.exports.removeProductFromCart = async (req, res) => {
    try {

        const { id } = req.params
        
        const errors = [];

        if (!id || id <= 0) errors.push('id cần cung cấp');
        
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const cartItem = await CartItem.findByPk(id);

        if (!cartItem) {
            return res.status(404).json({ code: 1, message: 'Sản phẩm không tồn tại trong giỏ hàng' });
        }

        await cartItem.destroy();

        return res.status(200).json({ code: 0, message: 'Xóa sản phẩm khỏi giỏ hàng thành công', data: cartItem });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa sản phẩm khỏi giỏ hàng thất bại', error: error.message });
    }
}

module.exports.reduceProductInCart = async (req, res) => {
    try {

        const { id } = req.params

        const errors = [];

        if (!id || id <= 0) errors.push('id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const cartItem = await CartItem.findByPk(id);

        if (!cartItem) {
            return res.status(404).json({ code: 1, message: 'Sản phẩm không tồn tại trong giỏ hàng' });
        }

        if (cartItem.quantity > 1) {
            cartItem.quantity -= 1;
            await cartItem.save();
        } else {
            cartItem.quantity = 0;
            await cartItem.destroy();
        }

        return res.status(200).json({ code: 0, message: 'Giảm số lượng sản phẩm trong giỏ hàng thành công', data: cartItem });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Giảm số lượng sản phẩm trong giỏ hàng thất bại', error: error.message });
    }
}

module.exports.removeManyProductFromCart = async (req, res) => {
    try {
        const { user_id, product_ids } = req.body

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) errors.push('product_ids cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const deletePromises = product_ids.map(product_id => 
            CartItem.destroy({ where: { user_id, product_id } })
        );

        await Promise.all(deletePromises);

        return res.status(200).json({ code: 0, message: 'Xóa sản phẩm khỏi giỏ hàng thành công', data: product_ids });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa sản phẩm khỏi giỏ hàng thất bại', error: error.message });
    }
}