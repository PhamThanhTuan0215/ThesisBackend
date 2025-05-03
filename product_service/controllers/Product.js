const Product = require('../database/models/Product')

module.exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll();
        
        return res.status(200).json({ code: 0, message: 'Get all products successfully', data: products });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: error.message });
    }
}