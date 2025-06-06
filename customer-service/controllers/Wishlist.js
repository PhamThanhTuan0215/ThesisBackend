const WishlistItem = require('../database/models/WishlistItem')

module.exports.getWishlist = async (req, res) => {
    try {

        const { user_id } = req.query

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const wishlistItems = await WishlistItem.findAll({
            where: { user_id },
            order: [['updatedAt', 'DESC']]
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách sản phẩm trong danh sách yêu thích thành công', data: wishlistItems });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách sản phẩm trong danh sách yêu thích thất bại', error: error.message });
    }
}

module.exports.getProductIds = async (req, res) => {

    const { user_id } = req.query

    const errors = [];

    if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');

    if (errors.length > 0) {
        return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
    }

    const wishlistItems = await WishlistItem.findAll({ where: { user_id }, attributes: ['product_id'] });

    const product_ids = wishlistItems.map(item => item.product_id);

    return res.status(200).json({ code: 0, message: 'Lấy danh sách sản phẩm trong danh sách yêu thích thành công', data: product_ids });
}

module.exports.addProductToWishlist = async (req, res) => {
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

        let existingItem = await WishlistItem.findOne({ where: { user_id, product_id } });

        if (existingItem) {
            return res.status(200).json({ code: 0, message: 'Sản phẩm đã có trong danh sách yêu thích', data: existingItem });
        }

        const wishlist_items = await WishlistItem.create({
            user_id,
            product_id,
            product_name,
            product_url_image,
            price,
            seller_id,
            seller_name
        });

        return res.status(200).json({ code: 0, message: 'Thêm sản phẩm vào danh sách yêu thích thành công', data: wishlist_items });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Thêm sản phẩm khỏi danh sách yêu thích thất bại', error: error.message });
    }
}

module.exports.removeProductFromWishlist = async (req, res) => {
    try {

        const { id } = req.params

        const errors = [];

        if (!id || id <= 0) errors.push('id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const wishlistItem = await WishlistItem.findByPk(id);

        if (!wishlistItem) {
            return res.status(404).json({ code: 1, message: 'Sản phẩm không tồn tại trong danh sách yêu thích' });
        }

        await wishlistItem.destroy();

        return res.status(200).json({ code: 0, message: 'Xóa sản phẩm khỏi danh sách yêu thích thành công', data: wishlistItem });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa sản phẩm khỏi danh sách yêu thích thất bại', error: error.message });
    }
}