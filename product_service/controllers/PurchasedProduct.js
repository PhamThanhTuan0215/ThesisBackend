const PurchasedProduct = require('../database/models/PurchasedProduct')
const Product = require('../database/models/Product')
const { Sequelize } = require('sequelize');

module.exports.addPurchasedProduct = async (req, res) => {
    try {
        const { user_id, order_id, seller_id, list_product } = req.body

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!order_id || order_id <= 0) errors.push('order_id cần cung cấp');
        if (!seller_id || seller_id <= 0) errors.push('seller_id cần cung cấp');
        if (!list_product || !Array.isArray(list_product)) errors.push('list_product cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const records = list_product.map(item => ({
            user_id,
            order_id,
            seller_id,
            product_id: item.product_id,
            quantity: item.quantity,
            total_price: item.total_price,
        }));

        const purchasedProducts = await PurchasedProduct.bulkCreate(records);

        // cập nhật kho hàng đối với các sản phẩm vừa mua, giảm số lượng sản phẩm trong kho bằng số lượng đã mua
        for (const product of purchasedProducts) {
            await Product.update({
                stock: Sequelize.literal(`
                    CASE 
                        WHEN stock - ${product.quantity} >= 0 THEN stock - ${product.quantity}
                        ELSE 0
                    END
                `)
            }, {
                where: { id: product.product_id }
            });
        }

        return res.status(200).json({ code: 0, message: 'Thêm sản phẩm đã mua thành công', data: purchasedProducts });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Thêm sản phẩm đã mua thất bại', error: error.message });
    }
}

module.exports.updateStatusPurchasedProduct = async (req, res) => {
    try {
        const { order_id, status } = req.body

        const errors = [];

        if (!order_id || order_id <= 0) errors.push('order_id cần cung cấp');
        if (!status || status === '') errors.push('status cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const [affectedRows, updatedRows] = await PurchasedProduct.update(
            { status },
            { where: { order_id }, returning: true }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ code: 1, message: 'Sản phẩm đã mua không tồn tại hoặc không bị thay đổi' });
        }

        return res.status(200).json({ code: 0, message: 'Cập nhật trạng thái sản phẩm đã mua thành công', data: updatedRows });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Cập nhật trạng thái sản phẩm đã mua thất bại', error: error.message });
    }
}

module.exports.deletePurchasedProduct = async (req, res) => {
        try {
        const { order_id } = req.params

        const errors = [];

        if (!order_id || order_id <= 0) errors.push('order_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const purchasedProducts = await PurchasedProduct.findAll({
            where: { order_id }
        });

        if(purchasedProducts.length <= 0) {
            return res.status(404).json({ code: 1, message: 'Sản phẩm đã mua không tồn tại' });
        }

        // cập nhật kho hàng đối với các sản phẩm đã mua nhưng bị hủy đơn => tăng lại số lượng sản phẩm trong kho bằng số lượng bị hủy
        for (const product of purchasedProducts) {
            await Product.update({
                stock: Sequelize.literal(`stock + ${product.quantity}`)
            }, {
                where: { id: product.product_id }
            });
        }

        await PurchasedProduct.destroy({
            where: { order_id }
        });

        return res.status(200).json({ code: 0, message: 'Xóa sản phẩm đã mua thành công', data: purchasedProducts });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa sản phẩm đã mua thất bại', error: error.message });
    }
}