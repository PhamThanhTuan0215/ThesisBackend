const PurchasedProduct = require('../database/models/PurchasedProduct')

module.exports.addPurchasedProduct = async (req, res) => {
    try {
        const { user_id, order_id, seller_id, list_product } = req.body

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id is required');
        if (!order_id || order_id <= 0) errors.push('order_id is required');
        if (!seller_id || seller_id <= 0) errors.push('seller_id is required');
        if (!list_product || !Array.isArray(list_product)) errors.push('list_product are required');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Validation failed', errors });
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

        return res.status(200).json({ code: 0, message: 'Add purchased product successfully', data: purchasedProducts });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Add purchased product failed', error: error.message });
    }
}

module.exports.updateStatusPurchasedProduct = async (req, res) => {
    try {
        const { order_id, status } = req.body

        const errors = [];

        if (!order_id || order_id <= 0) errors.push('order_id is required');
        if (!status || status === '') errors.push('status is required');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Validation failed', errors });
        }

        const [affectedRows, updatedRows] = await PurchasedProduct.update(
            { status },
            { where: { order_id }, returning: true }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ code: 1, message: 'Purchased product not found or no changes made' });
        }

        return res.status(200).json({ code: 0, message: 'Update status purchased product successfully', data: updatedRows });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Update status purchased product failed', error: error.message });
    }
}

module.exports.deletePurchasedProduct = async (req, res) => {
        try {
        const { order_id } = req.params

        const errors = [];

        if (!order_id || order_id <= 0) errors.push('order_id is required');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Validation failed', errors });
        }

        const deletedCount = await PurchasedProduct.destroy({
            where: { order_id }
        });

        if(deletedCount === 0) {
            return res.status(404).json({ code: 1, message: 'Purchased product not found' });
        }

        return res.status(200).json({ code: 0, message: 'Delete purchased product successfully', data: deletedCount });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Delete purchased product failed', error: error.message });
    }
}