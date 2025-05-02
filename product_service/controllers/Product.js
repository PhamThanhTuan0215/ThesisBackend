const ProductService = require('../services/ProductService')

module.exports.getAllProducts = async (req, res) => {
    try {
        const products = await ProductService.getAllProducts();
        return res.status(200).json({ code: 0, message: 'Get all products successfully', data: products });
    }
    catch (error) {
        return res.status(500).json({ code: 1, message: error.message });
    }
}