const WishlistItem = require('../database/models/WishlistItem')
const axiosProductService = require('../services/productService')
const { formatItem } = require('../utils/formatItem')

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

        const product_ids = wishlistItems.map(item => item.product_id);

        //gọi api tới product-service để lấy danh sách sản phẩm
        const response = await axiosProductService.post('/products/get-products-by-ids', {
            product_ids
        });

        if (response.data.code !== 0) {
            return res.status(400).json({ code: 1, message: response.data.message || 'Lấy danh sách sản phẩm trong danh sách yêu thích thất bại' });
        }

        const products = response.data.data;

        const wishlistItemsWithProducts = wishlistItems.map(item => {
            const product = products.find(product => product.id === item.product_id);
            return formatItem(item, product);
        });

        // lọc ra các sản phẩm đang được phép bán
        const resultWishlistItems = wishlistItemsWithProducts.filter(product => 
            product.approval_status === 'approved' && 
            product.active_status === 'active' && 
            product.platform_active_status === 'active'
        );

        return res.status(200).json({ code: 0, message: 'Lấy danh sách sản phẩm trong danh sách yêu thích thành công', data: resultWishlistItems });
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
        } = req.body;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!product_id || product_id <= 0) errors.push('product_id cần cung cấp');

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
        });

        return res.status(200).json({ code: 0, message: 'Thêm sản phẩm vào danh sách yêu thích thành công', data: wishlist_items });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Thêm sản phẩm khỏi danh sách yêu thích thất bại', error: error.message });
    }
}

module.exports.removeProductFromWishlist = async (req, res) => {
    try {

        const { user_id, product_id } = req.query

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!product_id || product_id <= 0) errors.push('product_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const wishlistItem = await WishlistItem.findOne({ where: { user_id, product_id } });

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