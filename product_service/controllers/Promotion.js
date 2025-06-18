const Promotion = require('../database/models/Promotion')
const PromotionProduct = require('../database/models/PromotionProduct')
const Product = require('../database/models/Product')
const CatalogProduct = require('../database/models/CatalogProduct')

const { Op } = require('sequelize');

module.exports.getAllPromotions = async (req, res) => {
    try {
        const { seller_id, status, page, limit } = req.query;

        const errors = [];

        if (!seller_id || seller_id === '') errors.push('seller_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        // phân trang nếu có
        let offset = 0
        let limitNumber = null
        if (limit && !isNaN(limit)) {
            limitNumber = parseInt(limit);

            if (page && !isNaN(page)) {
                const pageNumber = parseInt(page);
                offset = (pageNumber - 1) * limitNumber;
            }
        }

        const condition = { seller_id };
        if (status) condition.status = status;

        const promotions = await Promotion.findAll({ where: condition, limit: limitNumber, offset });

        const total = await Promotion.count({ where: condition });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách chương trình khuyến mãi thành công', total, data: promotions });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách chương trình khuyến mãi thất bại', error: error.message });
    }
}

module.exports.getPromotionById = async (req, res) => {
    try {
        const { id } = req.params;

        const promotion = await Promotion.findByPk(id);

        if (!promotion) {
            return res.status(404).json({ code: 1, message: 'Chương trình khuyến mãi không tồn tại' });
        }

        return res.status(200).json({ code: 0, message: 'Lấy thông tin chương trình khuyến mãi thành công', data: promotion });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy thông tin chương trình khuyến mãi thất bại', error: error.message });
    }
}

module.exports.createPromotion = async (req, res) => {
    try {
        const { name, type, value, start_date, end_date, seller_id } = req.body;

        const errors = [];

        if (!seller_id || seller_id === '') errors.push('seller_id cần cung cấp');
        if (!name || name === '') errors.push('name cần cung cấp');
        if (!type || type === '') errors.push('type cần cung cấp');
        if (!value || value <= 0) errors.push('value cần cung cấp');
        if (isNaN(Date.parse(start_date))) {
            errors.push('start_date phải là ngày hợp lệ');
        }
        if (isNaN(Date.parse(end_date))) {
            errors.push('end_date phải là ngày hợp lệ');
        }

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const promotion = await Promotion.create({ name, type, value, start_date, end_date, seller_id });

        return res.status(201).json({ code: 0, message: 'Tạo chương trình khuyến mãi thành công', data: promotion });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Tạo chương trình khuyến mãi thất bại', error: error.message });
    }
}

module.exports.updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, value, start_date, end_date, status } = req.body;

        const errors = [];

        if (!name || name === '') errors.push('name cần cung cấp');
        if (!type || type === '') errors.push('type cần cấp');
        if (!value || value <= 0) errors.push('value cần cấp');
        if (isNaN(Date.parse(start_date))) {
            errors.push('start_date phải là ngày hợp lệ');
        }
        if (isNaN(Date.parse(end_date))) {
            errors.push('end_date phải là ngày hợp lệ');
        }

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const [affectedRows, updatedRows] = await Promotion.update(
            { name, type, value, start_date, end_date, status },
            { where: { id }, returning: true }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ code: 1, message: 'Chương trình khuyến mãi không tồn tại' });
        }

        const promotion = updatedRows[0];

        return res.status(200).json({ code: 0, message: 'Cập nhật chương trình khuyến mãi thành công', data: promotion });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Cập nhật chương trình khuyến mãi thất bại', error: error.message });
    }
}

module.exports.deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;

        const promotion = await Promotion.findByPk(id);

        if (!promotion) {
            return res.status(404).json({ code: 1, message: 'Chương trình khuyến mãi không tồn tại' });
        }

        await promotion.destroy();

        return res.status(200).json({ code: 0, message: 'Xóa chương trình khuyến mãi thành công', data: promotion });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa chương trình khuyến mãi thất bại', error: error.message });
    }
}

module.exports.updatePromotionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const [affectedRows, updatedRows] = await Promotion.update(
            { status },
            { where: { id }, returning: true }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ code: 1, message: 'Chương trình khuyến mãi không tồn tại' });
        }

        const promotion = updatedRows[0];

        return res.status(200).json({ code: 0, message: 'Cập nhật trạng thái chương trình khuyến mãi thành công', data: promotion });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Cập nhật trạng thái chương trình khuyến mãi thất bại', error: error.message });
    }
}

module.exports.applyProductsToPromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_ids } = req.body;

        const errors = [];

        if (!product_ids || product_ids.length === 0) errors.push('product_ids cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const promotion = await Promotion.findByPk(id);

        if (!promotion) {
            return res.status(404).json({ code: 1, message: 'Chương trình khuyến mãi không tồn tại' });
        }

        const promises = product_ids.map(async (product_id) => {
            const product = await Product.findByPk(product_id, { attributes: ['id'] });
            if (product) {
                // tạo nếu chưa có
                const promotionProduct = await PromotionProduct.findOne({ where: { promotion_id: id, product_id } });
                if (!promotionProduct) {
                    await PromotionProduct.create({ promotion_id: id, product_id });
                }
            }
        });
        await Promise.all(promises);

        return res.status(200).json({ code: 0, message: 'Áp dụng sản phẩm vào chương trình khuyến mãi thành công', data: { promotion, product_ids } });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Áp dụng sản phẩm vào chương trình khuyến mãi thất bại', error: error.message });
    }
}

module.exports.removeProductFromPromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_ids } = req.body;

        const errors = [];

        if (!product_ids || product_ids.length === 0) errors.push('product_ids cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const promotion = await Promotion.findByPk(id);

        if (!promotion) {
            return res.status(404).json({ code: 1, message: 'Chương trình khuyến mãi không tồn tại' });
        }

        await PromotionProduct.destroy({ where: { promotion_id: id, product_id: { [Op.in]: product_ids } } });

        return res.status(200).json({ code: 0, message: 'Xóa sản phẩm khỏi chương trình khuyến mãi thành công', data: { promotion, product_ids } });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa sản phẩm khỏi chương trình khuyến mãi thất bại', error: error.message });
    }
}

module.exports.getProductsInPromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit, page } = req.query;

        const errors = [];

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const promotion = await Promotion.findByPk(id);

        if (!promotion) {
            return res.status(404).json({ code: 1, message: 'Chương trình khuyến mãi không tồn tại' });
        }

        // phân trang nếu có

        let offset = 0
        let limitNumber = null
        if (limit && !isNaN(limit)) {
            limitNumber = parseInt(limit);
        }

        // lấy danh sách ids của promotion_products
        const promotionProducts = await PromotionProduct.findAll({ where: { promotion_id: id }, attributes: ['product_id'] });
        const product_ids = promotionProducts.map((promotionProduct) => promotionProduct.product_id);

        // lấy danh sách sản phẩm
        const products = await Product.findAll({
            where: { id: { [Op.in]: product_ids } },
            limit: limitNumber,
            offset,
            attributes: ['id', 'stock', 'retail_price', 'actual_price', 'promotion_name', 'promotion_value_percent', 'promotion_start_date', 'promotion_end_date'],
            include: [
                {
                    model: CatalogProduct,
                    required: true, // inner join
                    attributes: ['name', 'url_image']
                },
                {
                    model: Promotion,
                    through: { attributes: ['custom_start_date', 'custom_end_date', 'custom_value'] }, // Lấy các trường từ bảng PromotionProduct
                }
            ]
        });

        const formattedProducts = products.map(formatProductLite);

        const total = await Product.count({ where: { id: { [Op.in]: product_ids } } });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách sản phẩm đã áp dụng khuyến mãi thành công', total, data: formattedProducts });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách sản phẩm đã áp dụng khuyến mãi thất bại', error: error.message });
    }
}

module.exports.customProductInPromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_ids, custom_value, custom_start_date, custom_end_date } = req.body;

        const errors = [];

        if (!product_ids || product_ids.length === 0) errors.push('product_ids cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const promotion = await Promotion.findByPk(id);

        if (!promotion) {
            return res.status(404).json({ code: 1, message: 'Chương trình khuyến mãi không tồn tại' });
        }

        // dùng Op.in để cập nhật 1 lần
        const [affectedRows, updatedRows] = await PromotionProduct.update({ custom_value, custom_start_date, custom_end_date }, { where: { promotion_id: id, product_id: { [Op.in]: product_ids } }, returning: true });

        if (affectedRows === 0) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy sản phẩm trong chương trình khuyến mãi' });
        }

        const promotionProducts = updatedRows;

        return res.status(200).json({ code: 0, message: 'Tùy chỉnh khuyến mãi cho sản phẩm thành công', data: { promotion, promotionProducts } });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Tùy chỉnh khuyến mãi cho sản phẩm thất bại', error: error.message });
    }
}


// format lại product phiên bản thu gọn
function formatProductLite(product) {
    const plain = product.toJSON();

    const formattedProduct = {
        ...plain,
        name: product.CatalogProduct?.name,
        url_image: product.CatalogProduct?.url_image
    };

    delete formattedProduct.CatalogProduct;
    delete formattedProduct.Promotions;

    return formattedProduct;
}