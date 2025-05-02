const Product = require('../models/Product');

class ProductService {
    
    static async getAllProducts() {
        const products = await Product.findAll();
        return products;
    }
}

module.exports = ProductService;