const CartItem = require('../database/models/CartItem')
const axiosProductService = require('../services/productService')

module.exports.getCart = async (req, res) => {
    try {

        const { user_id } = req.query

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const cartItems = await CartItem.findAll({
            where: { user_id },
            order: [['updatedAt', 'DESC']]
        });

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

module.exports.addProductToCart = async (req, res) => {
    try {

        const {
            user_id,
            product_id,
            product_name,
            product_url_image,
            price,
            seller_id,
            seller_name
        } = req.body;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!product_id || product_id <= 0) errors.push('product_id cần cung cấp');
        if (!product_name || product_name === '') errors.push('product_name cần cung cấp');
        if (!product_url_image || product_url_image === '') errors.push('product_url_image cần cung cấp');
        if (!price || isNaN(price) || price < 0) errors.push('price phải là số và lơn hơn hoặc bằng 0');
        if (!seller_id || seller_id <= 0) errors.push('seller_id cần cung cấp');
        if (!seller_name || seller_name === '') errors.push('seller_name cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        let existingItem = await CartItem.findOne({ where: { user_id, product_id } });

        if (existingItem) {

            existingItem.quantity += 1;

            const response = await axiosProductService.post('/products/check-stock', {
                products: [
                    {
                        id: product_id,
                        name: product_name,
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
                        name: product_name,
                        quantity: 1
                    }
                ]
            });

            if (response.data.code !== 0) {
                return res.status(400).json({ code: 1, message: response.data.message || 'Sản phẩm không đủ hàng' });
            }

            existingItem = await CartItem.create({
                user_id,
                product_id,
                product_name,
                product_url_image,
                price,
                seller_id,
                seller_name
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

        if (!id || id <= 0) errors.push('cart_item_id cần cung cấp');

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

        return res.status(200).json({ code: 0, message: 'Xóa sản phẩm khỏi giỏ hàng thành công', data: cartItem });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa sản phẩm khỏi giỏ hàng thất bại', error: error.message });
    }
}